import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVenueStore } from "@/stores/venueStore";
import { useListSuppliers, useGetSupplierCutoffs, getListSuppliersQueryKey, getGetSupplierCutoffsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Truck, Plus, Clock, ExternalLink, Phone, Mail, Scale, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SupplierCsvImportDialog } from "@/components/SupplierCsvImportDialog";

export default function SuppliersPage() {
  const { activeVenueId } = useVenueStore();
  const queryClient = useQueryClient();
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  const { data: suppliers, isLoading: isLoadingSuppliers } = useListSuppliers(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getListSuppliersQueryKey(activeVenueId as number) } }
  );

  const { data: cutoffs, isLoading: isLoadingCutoffs } = useGetSupplierCutoffs(
    activeVenueId as number,
    { query: { enabled: !!activeVenueId, queryKey: getGetSupplierCutoffsQueryKey(activeVenueId as number) } }
  );

  if (!activeVenueId) {
    return <div className="text-center p-8">Please select a venue first.</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="w-8 h-8 text-primary" />
            Suppliers
          </h1>
          <p className="text-muted-foreground mt-1">Manage vendor contacts and cutoffs.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" className="border-border text-foreground hover:bg-secondary">
            <Link href="/suppliers/price-comparison"><Scale className="w-4 h-4 mr-2" /> Price Comparison</Link>
          </Button>
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-secondary"
            onClick={() => setCsvImportOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            <Link href="/suppliers/new"><Plus className="w-4 h-4 mr-2" /> Add Supplier</Link>
          </Button>
        </div>

        {activeVenueId && (
          <SupplierCsvImportDialog
            open={csvImportOpen}
            onClose={() => setCsvImportOpen(false)}
            venueId={activeVenueId as number}
            onImported={() => {
              queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey(activeVenueId as number) });
              queryClient.invalidateQueries({ queryKey: getGetSupplierCutoffsQueryKey(activeVenueId as number) });
            }}
          />
        )}
      </div>

      {isLoadingCutoffs ? (
        <Skeleton className="h-32 bg-card w-full" />
      ) : cutoffs && cutoffs.length > 0 ? (
        <Card className="bg-card border-border overflow-hidden">
          <div className="bg-primary/10 px-4 py-2 border-b border-border flex items-center gap-2 text-primary font-medium text-sm">
            <Clock className="w-4 h-4" /> Upcoming Cutoffs
          </div>
          <CardContent className="p-0">
            {(() => {
              const phoneBySupplier = new Map(suppliers?.map(s => [s.id, s.phone]) ?? []);
              return (
            <div className="divide-y divide-border">
              {cutoffs.map((cutoff, idx) => {
                const phone = phoneBySupplier.get(cutoff.supplierId);
                return (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      cutoff.isUrgent ? "bg-status-critical" : "bg-status-healthy"
                    )} />
                    <div>
                      <p className="font-bold text-foreground">{cutoff.supplierName}</p>
                      <p className={cn(
                        "text-xs mt-0.5",
                        cutoff.isUrgent ? "text-status-critical font-medium" : "text-muted-foreground"
                      )}>
                        {cutoff.message || `Cutoff at ${cutoff.cutoffTime}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {phone && (
                      <Button
                        size="sm"
                        variant={cutoff.isUrgent ? "default" : "outline"}
                        className={cn(cutoff.isUrgent && "bg-primary text-primary-foreground hover:bg-primary/90")}
                        asChild
                      >
                        <a href={`tel:${phone}`}><Phone className="w-3.5 h-3.5 mr-1.5" />Call</a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/suppliers/${cutoff.supplierId}`}>Order</Link>
                    </Button>
                  </div>
                </div>
              );})}
            </div>
              );
            })()}
          </CardContent>
        </Card>
      ) : null}

      {isLoadingSuppliers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 bg-card w-full" />)}
        </div>
      ) : !suppliers || suppliers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No suppliers yet</h3>
          <p className="mb-4">Add your vendors to track orders and price changes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(supplier => (
            <Card key={supplier.id} className="bg-card border-border hover:border-primary/50 transition-colors flex flex-col h-full">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-foreground">{supplier.name}</h3>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {supplier.category && (
                        <Badge variant="secondary" className="text-xs">{supplier.category}</Badge>
                      )}
                      {supplier.hasInvoiceGap && (
                        <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {supplier.daysSinceLastInvoice != null
                            ? `Invoice gap (${supplier.daysSinceLastInvoice}d)`
                            : "No invoices on file"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 -mr-2 -mt-2 text-muted-foreground" asChild>
                    <Link href={`/suppliers/${supplier.id}`}><ExternalLink className="w-4 h-4" /></Link>
                  </Button>
                </div>
                
                <div className="space-y-3 flex-1">
                  {supplier.contactName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-medium text-foreground">{supplier.contactName}</span>
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <a href={`tel:${supplier.phone}`} className="hover:text-primary">{supplier.phone}</a>
                    </p>
                  )}
                  {supplier.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <a href={`mailto:${supplier.email}`} className="hover:text-primary truncate">{supplier.email}</a>
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                  {supplier.orderCutoffTime && (
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Cutoff</span>
                      <span className="font-medium text-foreground">{supplier.orderCutoffTime}</span>
                    </div>
                  )}
                  {supplier.deliveryDays && (
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Delivery</span>
                      <span className="font-medium text-foreground truncate" title={supplier.deliveryDays}>{supplier.deliveryDays}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}