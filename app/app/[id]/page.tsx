"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
import {
  getProtocolById,
  updateProtocol,
  deleteProtocol,
  type Protocol,
  type ProtocolStatus,
} from "@/lib/storage/protocols"
import { protocolSchema, type ProtocolFormValues } from "@/lib/validators/protocol"

export default function ProtocolDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const protocolId = params?.id

  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolSchema),
    defaultValues: {
      title: "",
      study_question: "",
      population: "",
      comparator: "",
      outcomes: "",
      design: "",
      status: "draft",
    },
    mode: "onTouched",
  })

  useEffect(() => {
    if (!protocolId || typeof protocolId !== "string") {
      setError("Missing protocol ID.")
      setIsLoading(false)
      return
    }

    const data = getProtocolById(protocolId)
    
    if (!data) {
      setError("Protocol not found.")
      setIsLoading(false)
      return
    }
    
    setProtocol(data)
    form.reset({
      title: data.title,
      study_question: data.study_question,
      population: data.population,
      comparator: data.comparator,
      outcomes: data.outcomes,
      design: data.design,
      status: data.status,
    })
    setIsLoading(false)
  }, [protocolId, form])

  const handleSave = (values: ProtocolFormValues) => {
    if (!protocolId || typeof protocolId !== "string") return
    setError(null)
    setIsSaving(true)

    try {
      const updated = updateProtocol(protocolId, {
        ...values,
        status: values.status as ProtocolStatus,
      })

      if (updated) {
        setProtocol(updated)
        form.reset({
          title: updated.title,
          study_question: updated.study_question,
          population: updated.population,
          comparator: updated.comparator,
          outcomes: updated.outcomes,
          design: updated.design,
          status: updated.status,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save protocol")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (!protocolId || typeof protocolId !== "string") return
    if (!window.confirm("Delete this protocol? This cannot be undone.")) return
    
    setIsDeleting(true)
    const deleted = deleteProtocol(protocolId)
    
    if (deleted) {
      router.push("/app")
    } else {
      setError("Failed to delete protocol")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading protocol...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  if (!protocol) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Protocol unavailable</CardTitle>
              <CardDescription>
                {error ?? "We couldn't load that protocol."}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="ghost">
                <Link href="/app">Back to dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Protocol details</CardTitle>
            <CardDescription>
              Last updated {new Date(protocol.updated_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
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
                        <Input {...field} />
                      </FormControl>
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
                        <Textarea rows={4} {...field} />
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
                          <Textarea rows={3} {...field} />
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
                          <Textarea rows={3} {...field} />
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
                        <Textarea rows={4} {...field} />
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
                          <Input {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                <div className="flex flex-wrap gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleDelete} 
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </main>
  )
}
