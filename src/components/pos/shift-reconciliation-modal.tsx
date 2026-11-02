"use client";

import React, { useState, useMemo } from "react";
import {
  IconClock,
  IconCash,
  IconReceipt2,
  IconAlertTriangle,
  IconCheck,
  IconPrinter,
  IconBuildingStore,
  IconUser,
  IconFileInvoice,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type POSShiftDetail } from "@/services/sales.service";

interface ShiftReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: POSShiftDetail | null;
  branchName?: string;
  onOpenShift: (openingCash: number, notes?: string) => Promise<void>;
  onCloseShift: (closingCash: number, notes?: string) => Promise<void>;
}

export function ShiftReconciliationModal({
  isOpen,
  onClose,
  shift,
  branchName = "Main Branch",
  onOpenShift,
  onCloseShift,
}: ShiftReconciliationModalProps) {
  const [openingFloat, setOpeningFloat] = useState("5000");
  const [countedCash, setCountedCash] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showZReport, setShowZReport] = useState(false);

  const isShiftOpen = shift && shift.status === "open";

  const expectedCash = useMemo(() => {
    if (!shift) return 0;
    return Number(shift.expected_cash || shift.opening_cash || 0);
  }, [shift]);

  const variance = useMemo(() => {
    if (!countedCash) return 0;
    const actual = Number(countedCash) || 0;
    return actual - expectedCash;
  }, [countedCash, expectedCash]);

  const handleAction = async () => {
    setIsSubmitting(true);
    try {
      if (isShiftOpen) {
        await onCloseShift(Number(countedCash) || 0, notes);
        setShowZReport(true);
      } else {
        await onOpenShift(Number(openingFloat) || 0, notes);
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <IconClock className="h-5 w-5 text-primary" />
            {isShiftOpen ? "Close Cashier Shift & Reconcile" : "Start New Register Shift"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isShiftOpen
              ? "Reconcile register cash drawer balance and print End-of-Day Z-Report."
              : "Set initial cash float for change before starting retail counter sales."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Branch & Status banner */}
          <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 border text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
              <span>{branchName}</span>
            </div>
            <Badge variant={isShiftOpen ? "default" : "secondary"} className="text-[10px]">
              {isShiftOpen ? "Active Session" : "No Open Shift"}
            </Badge>
          </div>

          {isShiftOpen ? (
            <div className="space-y-3">
              {/* Shift Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border space-y-0.5">
                  <div className="text-muted-foreground text-[10px]">Opening Float</div>
                  <div className="font-mono font-bold text-sm">
                    Rs {Number(shift?.opening_cash || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border space-y-0.5">
                  <div className="text-muted-foreground text-[10px]">Expected In Drawer</div>
                  <div className="font-mono font-bold text-sm text-primary">
                    Rs {expectedCash.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Cash Count Input */}
              <div className="space-y-1.5">
                <Label htmlFor="countedCash" className="text-xs font-semibold">
                  Actual Counted Cash in Drawer (PKR) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="countedCash"
                    type="number"
                    placeholder="Enter total physical cash..."
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="font-mono text-base pl-8 font-bold"
                    autoFocus
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">
                    Rs
                  </span>
                </div>
              </div>

              {/* Variance Indicator */}
              {countedCash && (
                <div
                  className={`p-2.5 rounded-md border text-xs flex items-center justify-between ${
                    variance === 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800"
                      : variance < 0
                        ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-800"
                        : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {variance === 0 ? (
                      <IconCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <IconAlertTriangle className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {variance === 0
                        ? "Perfect Match (No Difference)"
                        : variance < 0
                          ? "Cash Shortage in Drawer"
                          : "Cash Excess in Drawer"}
                    </span>
                  </div>
                  <span className="font-mono font-bold">
                    {variance > 0 ? "+" : ""}Rs {variance.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="openingFloat" className="text-xs font-semibold">
                  Starting Drawer Float (PKR) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="openingFloat"
                    type="number"
                    placeholder="e.g. 5000"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    className="font-mono text-base pl-8 font-bold"
                    autoFocus
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">
                    Rs
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Cash kept in register for loose coins and change for initial morning customers.
                </p>
              </div>
            </div>
          )}

          {/* Handover Notes */}
          <div className="space-y-1">
            <Label htmlFor="shiftNotes" className="text-xs">
              Shift Handover Notes (Optional)
            </Label>
            <Input
              id="shiftNotes"
              placeholder="e.g. Returned Rs 500 advance to helper..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={isShiftOpen ? "destructive" : "default"}
            onClick={handleAction}
            disabled={Boolean(isSubmitting || (isShiftOpen && !countedCash))}
          >
            {isSubmitting
              ? "Processing..."
              : isShiftOpen
                ? "Close Shift & Print Summary"
                : "Open Register Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShiftReconciliationModal;
