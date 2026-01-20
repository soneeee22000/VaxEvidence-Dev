"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
import { createProtocol } from "@/lib/supabase/protocols"
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
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolSchema),
    defaultValues,
    mode: "onTouched",
  })

  const handleSubmit = async (values: ProtocolFormValues) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const { data, error } = await createProtocol({
        ...values,
        user_id: DEV_USER.id,
      })

      if (error) {
        throw new Error(error.message || "Failed to create protocol")
      }

      if (data) {
        router.push(`/app/${data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create protocol")
      setIsSubmitting(false)
    }
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
