import { useVenueStore } from "@/stores/venueStore";
import { 
  useCreateSupplier, 
  useUpdateSupplier, 
  useGetSupplier,
  useDeleteSupplier,
  useGetSupplierPriceHistory,
  getGetSupplierQueryKey,
  getGetSupplierPriceHistoryQueryKey,
} from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Trash2, Loader2, LineChart as ChartIcon, AlertTriangle, Download, Upload, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
  "Vegetables",
  "Fruit",
  "Meat",
  "Seafood",
  "Dairy",
  "Bakery",
  "Dry Goods",
  "Beverages",
  "Cleaning Supplies",
  "Packaging",
  "Other",
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  category: z.string().optional(),
  deliveryDays: z.string().optional(),
  orderCutoffTime: z.string().optional(),
  minimumOrderValue: z.coerce.number().optional().nullable(),
  deliveryFee: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function buildVCard(values: FormValues): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const fn = values.contactName || values.name;
  lines.push(`FN:${fn}`);
  lines.push(`N:${fn};;;;`);
  if (values.name) lines.push(`ORG:${values.name}`);
  if (values.phone) lines.push(`TEL;TYPE=WORK:${values.phone}`);
  if (values.email) lines.push(`EMAIL;TYPE=WORK:${values.email}`);
  if (values.website) lines.push(`URL:${values.website}`);
  const noteparts: string[] = [];
  if (values.category) noteparts.push(`Category: ${values.category}`);
  if (values.notes) noteparts.push(values.notes);
  if (noteparts.length) lines.push(`NOTE:${noteparts.join(" | ").replace(/\n/g, "\\n")}`);
  if (values.category) lines.push(`CATEGORIES:${values.category}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function parseVCard(text: string): Partial<FormValues> {
  const result: Partial<FormValues> = {};
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("FN:")) result.contactName = line.slice(3);
    else if (line.startsWith("ORG:")) result.name = line.slice(4);
    else if (line.match(/^TEL/i)) result.phone = line.split(":").slice(1).join(":");
    else if (line.match(/^EMAIL/i)) result.email = line.split(":").slice(1).join(":");
    else if (line.startsWith("URL:")) result.website = line.slice(4);
    else if (line.startsWith("CATEGORIES:")) result.category = line.slice(11).split(",")[0]?.trim();
    else if (line.startsWith("NOTE:")) {
      const note = line.slice(5).replace(/\\n/g, "\n");
      const categoryMatch = note.match(/Category:\s*([^|]+)/);
      if (categoryMatch) result.category = categoryMatch[1].trim();
      const cleanNote = note.replace(/Category:[^|]*\|?\s*/g, "").trim();
      if (cleanNote) result.notes = cleanNote;
    }
  }
  return result;
}

export default function SupplierFormPage() {
  const { activeVenueId } = useVenueStore();
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const vcfInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const isNew = !params.id || params.id === "new";
  const supplierId = isNew ? null : parseInt(params.id!);

  const { data: supplier, isLoading: isLoadingSupplier } = useGetSupplier(
    activeVenueId as number,
    supplierId as number,
    { query: { enabled: !!activeVenueId && !isNew, queryKey: getGetSupplierQueryKey(activeVenueId as number, supplierId as number) } }
  );

  const { data: priceHistory } = useGetSupplierPriceHistory(
    activeVenueId as number,
    supplierId as number,
    { query: { enabled: !!activeVenueId && !isNew, queryKey: getGetSupplierPriceHistoryQueryKey(activeVenueId as number, supplierId as number) } }
  );

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      category: "",
      deliveryDays: "",
      orderCutoffTime: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (supplier && !isNew) {
      form.reset({
        name: supplier.name,
        contactName: supplier.contactName || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        website: supplier.website || "",
        category: supplier.category || "",
        deliveryDays: supplier.deliveryDays || "",
        orderCutoffTime: supplier.orderCutoffTime || "",
        minimumOrderValue: supplier.minimumOrderValue,
        deliveryFee: supplier.deliveryFee,
        notes: supplier.notes || "",
      });
    }
  }, [supplier, isNew, form]);

  if (!activeVenueId) return <div className="p-8 text-center">Select a venue first.</div>;
  if (!isNew && isLoadingSupplier) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      email: values.email || undefined,
      website: values.website || undefined,
      category: values.category || undefined,
      minimumOrderValue: values.minimumOrderValue || undefined,
      deliveryFee: values.deliveryFee || undefined,
    };

    if (isNew) {
      createMutation.mutate({ venueId: activeVenueId, data: payload as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "suppliers"] });
          toast({ title: "Supplier added successfully" });
          setLocation("/suppliers");
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
      });
    } else {
      updateMutation.mutate({ venueId: activeVenueId, supplierId: supplierId!, data: payload as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "suppliers"] });
          queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "suppliers", supplierId] });
          toast({ title: "Supplier updated successfully" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
      });
    }
  };

  const handleDelete = () => {
    if (!confirm("Delete this supplier? All associated inventory links will be cleared.")) return;
    deleteMutation.mutate({ venueId: activeVenueId, supplierId: supplierId! }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/venues", activeVenueId, "suppliers"] });
        toast({ title: "Supplier deleted" });
        setLocation("/suppliers");
      }
    });
  };

  const handleExportVCard = () => {
    const values = form.getValues();
    const vcf = buildVCard(values);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${values.name || "supplier"}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Contact saved", description: "Open the .vcf file to add to your contacts." });
  };

  const applyImportedFields = (fields: Partial<FormValues>) => {
    const current = form.getValues();
    form.reset({
      ...current,
      ...Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined && v !== "")
      ),
    });
    toast({ title: "Contact imported", description: "Review the fields and save." });
  };

  const handleContactPickerImport = async () => {
    const nav = navigator as any;
    if (!nav.contacts || !nav.contacts.select) {
      toast({ title: "Not supported on this browser", description: "Use the Upload .vcf option instead.", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    try {
      const contacts = await nav.contacts.select(["name", "tel", "email", "url", "organization"], { multiple: false });
      if (!contacts || contacts.length === 0) return;
      const c = contacts[0];
      const fields: Partial<FormValues> = {};
      if (c.name?.[0]) fields.contactName = c.name[0];
      if (c.organization?.[0]) fields.name = c.organization[0];
      if (c.tel?.[0]) fields.phone = c.tel[0];
      if (c.email?.[0]) fields.email = c.email[0];
      if (c.url?.[0]) fields.website = c.url[0];
      applyImportedFields(fields);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast({ title: "Import failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleVcfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const fields = parseVCard(text);
      applyImportedFields(fields);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const supportsContactPicker = typeof navigator !== "undefined" && "contacts" in navigator;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={isNew ? "/suppliers" : `/suppliers/${supplierId}`}><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isNew ? "New Supplier" : `Edit: ${supplier?.name}`}</h1>
          <p className="text-sm text-muted-foreground">{isNew ? "Add a new vendor." : "Update details and terms."}</p>
        </div>
        {!isNew && (
          <Button variant="ghost" size="icon" className="ml-auto text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Contact import/export bar */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-3">Phone contacts</p>
          <div className="flex flex-wrap gap-2">
            {supportsContactPicker && (
              <Button variant="outline" size="sm" onClick={handleContactPickerImport} disabled={isImporting} className="border-primary/30 text-primary hover:bg-primary/10">
                {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
                Import from contacts
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => vcfInputRef.current?.click()} className="border-primary/30 text-primary hover:bg-primary/10">
              <Upload className="w-4 h-4 mr-2" />
              Upload .vcf
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportVCard} className="border-primary/30 text-primary hover:bg-primary/10">
              <Download className="w-4 h-4 mr-2" />
              Save to contacts
            </Button>
            <input ref={vcfInputRef} type="file" accept=".vcf,text/vcard" className="hidden" onChange={handleVcfUpload} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {supportsContactPicker
              ? "Pick a contact directly, upload a .vcf file, or download this supplier as a contact."
              : "Upload a .vcf file from your contacts app, or download this supplier as a contact to save to your phone."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Company / Supplier Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Sysco" className="bg-background border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="e.g. Seafood, Vegetables..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John Doe" className="bg-background border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) ..." className="bg-background border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Email for Orders</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="orders@..." className="bg-background border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Website</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://..." className="bg-background border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Logistics & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deliveryDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Delivery Days</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Mon, Wed, Fri" className="bg-background border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="orderCutoffTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Order Cutoff Time</FormLabel>
                          <FormControl>
                            <Input type="time" className="bg-background border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minimumOrderValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Minimum Order ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" className="bg-background border-border" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deliveryFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Delivery Fee ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" className="bg-background border-border" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Internal Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Account numbers, special instructions..." className="bg-background border-border resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-12" disabled={isPending}>
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                {isNew ? "Create Supplier" : "Save Changes"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Right column: Price History */}
        {!isNew && (
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-24">
              <CardHeader className="border-b border-border py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ChartIcon className="w-5 h-5 text-primary" />
                  Recent Price Spikes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!priceHistory || priceHistory.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No recent price changes detected.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {priceHistory.map(entry => (
                      <div key={entry.id} className="p-4 hover:bg-secondary/50 transition-colors">
                        <p className="font-medium text-foreground truncate">{entry.itemName}</p>
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="text-muted-foreground line-through decoration-destructive/50">
                            ${entry.oldPrice?.toFixed(2)}
                          </span>
                          <ArrowLeft className="w-3 h-3 text-muted-foreground rotate-180" />
                          <span className="font-bold text-status-critical">
                            ${entry.newPrice.toFixed(2)}
                          </span>
                        </div>
                        {entry.changePercent && entry.changePercent > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-status-critical font-medium bg-status-critical/10 w-fit px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            +{entry.changePercent.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
