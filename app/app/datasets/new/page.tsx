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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UploadDropzone } from "@/components/datasets/upload-dropzone"
import {
  datasetSchema,
  datasetTypes,
  datasetStatuses,
  suggestedDatasetTags,
  getFileType,
  getDatasetTypeLabel,
  type DatasetFormValues,
} from "@/lib/validators/dataset"
import {
  createDataset,
  uploadDatasetFile,
  extractFileMetadata,
} from "@/lib/supabase/datasets"
import { parseFile } from "@/lib/utils/file-parser"
import { DEV_USER } from "@/lib/auth/dev-auth"
import { useToast } from "@/hooks/use-toast"
import { Loader2, X, ChevronRight, ChevronLeft } from "lucide-react"

export default function NewDatasetPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedMetadata, setParsedMetadata] = useState<{
    rowCount: number
    columnCount: number
  } | null>(null)

  const form = useForm<DatasetFormValues>({
    resolver: zodResolver(datasetSchema),
    defaultValues: {
      name: "",
      description: "",
      dataset_type: "clinical_trial",
      tags: [],
      status: "draft",
    },
  })

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    
    // Auto-fill name from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
    form.setValue("name", nameWithoutExt)

    // Parse file to get metadata
    setIsProcessing(true)
    const parsed = await parseFile(file)
    
    if (parsed.error) {
      toast({
        title: "Warning",
        description: `Could not parse file: ${parsed.error}`,
        variant: "destructive",
      })
      setParsedMetadata(null)
    } else {
      setParsedMetadata({
        rowCount: parsed.rowCount,
        columnCount: parsed.columnCount,
      })
    }
    
    setIsProcessing(false)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setParsedMetadata(null)
    form.setValue("name", "")
  }

  const handleNext = () => {
    if (selectedFile) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async (values: DatasetFormValues) => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Step 1: Upload file to storage
      setUploadProgress(30)
      const fileType = getFileType(selectedFile.name)
      
      if (!fileType) {
        throw new Error("Unsupported file type")
      }

      const { data: uploadData, error: uploadError } = await uploadDatasetFile(
        selectedFile,
        DEV_USER.id
      )

      if (uploadError || !uploadData) {
        throw new Error(uploadError?.message || "Failed to upload file")
      }

      setUploadProgress(60)

      // Step 2: Create dataset metadata
      const datasetPayload = {
        ...values,
        user_id: DEV_USER.id,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: fileType,
        storage_path: uploadData.fullPath,
        row_count: parsedMetadata?.rowCount || null,
        column_count: parsedMetadata?.columnCount || null,
      }

      const { data: dataset, error: createError } = await createDataset(datasetPayload)

      if (createError || !dataset) {
        throw new Error(createError?.message || "Failed to create dataset")
      }

      setUploadProgress(100)

      toast({
        title: "Success",
        description: "Dataset uploaded successfully",
      })

      router.push(`/app/datasets/${dataset.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload dataset",
        variant: "destructive",
      })
      setIsProcessing(false)
      setUploadProgress(0)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload Dataset</CardTitle>
            <CardDescription>
              Step {step} of 2: {step === 1 ? "Select file" : "Add metadata"}
            </CardDescription>
          </CardHeader>

          {step === 1 ? (
            <>
              <CardContent className="space-y-6">
                <UploadDropzone
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  selectedFile={selectedFile}
                  disabled={isProcessing}
                />

                {selectedFile && parsedMetadata && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm font-medium mb-2">File Preview</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Rows:</span>{" "}
                        <span className="font-medium">
                          {parsedMetadata.rowCount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Columns:</span>{" "}
                        <span className="font-medium">{parsedMetadata.columnCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button asChild variant="ghost">
                  <Link href="/app/datasets">Cancel</Link>
                </Button>
                <Button onClick={handleNext} disabled={!selectedFile || isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dataset Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="COVID-19 Trial Data" />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for this dataset
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder="Describe what this dataset contains, its source, and any important details..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataset_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dataset Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {datasetTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {getDatasetTypeLabel(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="date_range_start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>Data collection start</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date_range_end"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>Data collection end</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {field.value.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {field.value.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="default"
                                    className="cursor-pointer"
                                    onClick={() => {
                                      const newTags = field.value.filter((t) => t !== tag)
                                      field.onChange(newTags)
                                    }}
                                  >
                                    {tag}
                                    <X className="ml-1 h-3 w-3" />
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {suggestedDatasetTags
                                .filter((tag) => !field.value.includes(tag))
                                .slice(0, 15)
                                .map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => {
                                      const newTags = [...field.value, tag]
                                      field.onChange(newTags)
                                    }}
                                  >
                                    + {tag}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Click to add or remove tags
                        </FormDescription>
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
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {datasetStatuses.map((status) => (
                              <SelectItem key={status} value={status} className="capitalize">
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>

                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isProcessing}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading... {uploadProgress}%
                      </>
                    ) : (
                      "Upload Dataset"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
        </Card>
      </div>
    </main>
  )
}
