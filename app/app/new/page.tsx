"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { ProtocolTemplateSelector } from "@/components/templates/ProtocolTemplateSelector"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DEV_USER } from "@/lib/auth/dev-auth"
import { createProtocol, createTemplateUsage } from "@/lib/supabase/protocols"
import { getTemplateById } from "@/lib/templates/protocol-templates"
import { protocolSchema, type ProtocolFormValues } from "@/lib/validators/protocol"

const defaultValues: ProtocolFormValues = {
  title: "",
  study_question: "",
  population: "",
  comparator: "",
  outcomes: "",
  design: "",
  status: "draft",
}

export default function NewProtocolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(true)

  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolSchema),
    defaultValues,
    mode: "onTouched",
  })

  const template = selectedTemplateId ? getTemplateById(selectedTemplateId) : null

  useEffect(() => {
    const templateFromQuery = searchParams?.get("template")
    if (!templateFromQuery) return
    if (templateFromQuery === selectedTemplateId) return
    const templateToApply = getTemplateById(templateFromQuery)
    if (!templateToApply) return
    setSelectedTemplateId(templateFromQuery)
    setShowTemplateSelector(false)
  }, [searchParams, selectedTemplateId])

  useEffect(() => {
    if (!template) return
    form.reset({
      ...defaultValues,
      title: template.title,
      study_question: template.study_question,
      population: template.population,
      comparator: template.comparator,
      outcomes: template.outcomes,
      design: template.study_design,
    })
  }, [form, template])

  const handleSubmit = async (values: ProtocolFormValues) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const { data, error } = await createProtocol({
        ...values,
        user_id: DEV_USER.id,
        template_id: template?.id,
        template_name: template?.name,
      })

      if (error) {
        throw new Error(error.message || "Failed to create protocol")
      }

      if (data) {
        if (template) {
          try {
            await createTemplateUsage({
              user_id: DEV_USER.id,
              template_id: template.id,
              template_name: template.name,
              created_protocol_id: data.id,
            })
          } catch (usageError) {
            console.warn("Failed to log template usage:", usageError)
          }
        }
        router.push(`/app/${data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create protocol")
      setIsSubmitting(false)
    }
  }

  if (showTemplateSelector) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Choose a protocol template</h1>
              <p className="text-muted-foreground">
                Start fast with a proven framework, or build from scratch.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedTemplateId(null)
                setShowTemplateSelector(false)
              }}
            >
              Skip templates
            </Button>
          </div>
          <ProtocolTemplateSelector
            onSelectTemplate={(templateId) => {
              setSelectedTemplateId(templateId)
              setShowTemplateSelector(false)
            }}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create a protocol</CardTitle>
            <CardDescription>Define the essentials for your study.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <CardContent className="space-y-6">
                {template && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    <p className="font-semibold">
                      Pre-filled from template: {template.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(null)
                        setShowTemplateSelector(true)
                      }}
                      className="mt-1 text-blue-700 underline"
                    >
                      Change template
                    </button>
                  </div>
                )}
                {error && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protocol title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Influenza Vaccine Effectiveness 2026"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Keep it specific so your team can find it quickly.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="study_question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study question</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What clinical question does this study answer?"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="population"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Population</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Define inclusion/exclusion criteria."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="comparator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comparator</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the comparator or control group."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="outcomes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outcomes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Primary and secondary outcomes."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="design"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study design</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., retrospective cohort study" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="in_review">In review</SelectItem>
                            <SelectItem value="final">Final</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap justify-between gap-3">
                <Button asChild variant="ghost">
                  <Link href="/app">Back to dashboard</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create protocol"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </main>
  )
}
