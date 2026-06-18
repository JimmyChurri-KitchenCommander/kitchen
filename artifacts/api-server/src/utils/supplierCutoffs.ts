export type SupplierCutoff = {
  supplierId: number;
  supplierName: string;
  cutoffTime: string;
  deliveryDay: string;
  minutesUntilCutoff: number | null;
  isUrgent: boolean;
  message: string;
};

export function computeSupplierCutoffs(
  suppliers: Array<{ id: number; name: string; orderCutoffTime: string | null; deliveryDays: string | null }>,
  now = new Date(),
): SupplierCutoff[] {
  return suppliers
    .filter((s) => s.orderCutoffTime && s.deliveryDays)
    .map((s) => {
      const [hours, minutes] = (s.orderCutoffTime as string).split(":").map(Number);
      const cutoffToday = new Date(now);
      cutoffToday.setHours(hours!, minutes!, 0, 0);
      const minutesUntilCutoff = Math.floor((cutoffToday.getTime() - now.getTime()) / 60_000);
      const isUrgent = minutesUntilCutoff >= 0 && minutesUntilCutoff <= 120;
      const timeStr = minutesUntilCutoff < 0 ? "cutoff passed"
        : minutesUntilCutoff < 60 ? `${minutesUntilCutoff}m`
        : `${Math.floor(minutesUntilCutoff / 60)}h ${minutesUntilCutoff % 60}m`;
      return {
        supplierId: s.id,
        supplierName: s.name,
        cutoffTime: s.orderCutoffTime as string,
        deliveryDay: s.deliveryDays as string,
        minutesUntilCutoff: minutesUntilCutoff >= 0 ? minutesUntilCutoff : null,
        isUrgent,
        message: `${s.name} order cutoff in ${timeStr}`,
      };
    })
    .sort((a, b) => (a.minutesUntilCutoff ?? 9999) - (b.minutesUntilCutoff ?? 9999));
}
