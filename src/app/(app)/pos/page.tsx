"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import {
  IconSearch,
  IconBarcode,
  IconPlus,
  IconMinus,
  IconTrash,
  IconPrinter,
  IconCheck,
  IconRefresh,
  IconBuildingStore,
  IconUser,
  IconReceiptTax,
  IconCash,
  IconCreditCard,
  IconShieldCheck,
  IconAlertCircle,
  IconDeviceDesktopAnalytics,
  IconChevronRight,
  IconArrowsExchange,
  IconClock,
  IconFileInvoice,
  IconUserPlus,
  IconPhoto,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productService, type ProductListItem, type CategoryItem } from "@/services/product.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import { partyService, type CustomerItem } from "@/services/party.service";
import { salesService, type SalesInvoiceDetail, type POSShiftDetail } from "@/services/sales.service";
import { useAppEventListener } from "@/lib/events";
import { useAuth } from "@/context/auth-context";
import { ThermalReceiptModal } from "@/components/pos/thermal-receipt";
import { ShiftReconciliationModal } from "@/components/pos/shift-reconciliation-modal";
import { useBarcodeScanner, playScanBeep } from "@/hooks/use-barcode-scanner";
import { cn } from "@/lib/utils";

const DEFAULT_PRODUCT_IMAGE = "/images/default-product.svg";

interface CartItem {
  product: ProductListItem;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
}

export default function POSPage() {
  const { tenant } = useAuth();

  // Master Data State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Filter & Search
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 0>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Shift & Cash Drawer State
  const [currentShift, setCurrentShift] = useState<POSShiftDetail | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState<string>("5000");
  const [closingCash, setClosingCash] = useState<string>("");
  const [shiftNotes, setShiftNotes] = useState<string>("");
  const [isShiftSaving, setIsShiftSaving] = useState(false);

  // Cart & Bill State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in");
  const [walkInName, setWalkInName] = useState("Walk-in Retail Buyer");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInCnic, setWalkInCnic] = useState("");
  const [cartDiscount, setCartDiscount] = useState<number>(0);

  // Quick Customer Registration
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustType, setNewCustType] = useState<string>("retailer");
  const [newCustCreditLimit, setNewCustCreditLimit] = useState<string>("50000");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const activeCustomer = useMemo(() => {
    if (selectedCustomerId === "walk-in") return null;
    return customers.find((c) => String(c.id) === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Restore persisted cart on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("paperless_pos_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }
      const savedCust = localStorage.getItem("paperless_pos_customer");
      if (savedCust) setSelectedCustomerId(savedCust);

      const savedDisc = localStorage.getItem("paperless_pos_discount");
      if (savedDisc) setCartDiscount(Number(savedDisc) || 0);
    } catch (e) {
      console.warn("Failed to restore POS cart from localStorage", e);
    }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem("paperless_pos_cart", JSON.stringify(cart));
      } else {
        localStorage.removeItem("paperless_pos_cart");
      }
    } catch (e) {}
  }, [cart]);

  // Persist customer to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("paperless_pos_customer", selectedCustomerId);
    } catch (e) {}
  }, [selectedCustomerId]);

  // Persist discount to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("paperless_pos_discount", String(cartDiscount));
    } catch (e) {}
  }, [cartDiscount]);

  const handleClearCart = () => {
    setCart([]);
    setCartDiscount(0);
    try {
      localStorage.removeItem("paperless_pos_cart");
      localStorage.removeItem("paperless_pos_discount");
    } catch (e) {}
    toast.info("Cart cleared");
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      toast.error("Please enter shop or customer name");
      return;
    }
    setIsSavingCustomer(true);
    try {
      const code = `CUST-${Date.now().toString().slice(-4)}`;
      const payload = {
        code,
        business_name: newCustName.trim(),
        phone: newCustPhone.trim() || "0300-0000000",
        customer_type: newCustType,
        credit_limit: Number(newCustCreditLimit) || 0,
        credit_days: 15,
        opening_balance: 0,
        city: "Local",
      };
      const created = await partyService.createCustomer(payload);
      toast.success(`Customer "${created.business_name}" registered!`);
      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomerId(String(created.id));
      setIsQuickCustomerOpen(false);
      setNewCustName("");
      setNewCustPhone("");
    } catch (err: any) {
      toast.error("Failed to add customer: " + (err.message || err));
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash");
  const [tenderedAmount, setTenderedAmount] = useState<string>("");
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Receipt Modal State
  const [lastInvoice, setLastInvoice] = useState<SalesInvoiceDetail | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadInitial() {
      try {
        const [bListRes, cList, custList] = await Promise.all([
          branchService.listBranches(),
          productService.listCategories(),
          partyService.listCustomers(),
        ]);
        const branchList = bListRes.branches || [];
        setBranches(branchList);
        setCategories(cList);
        setCustomers(custList);

        if (branchList.length > 0) {
          const defaultBranch = branchList[0].id;
          setSelectedBranchId(defaultBranch);
          loadShift(defaultBranch);
        }
        loadProducts();
      } catch (err: any) {
        toast.error("Failed to load initial POS data: " + (err.message || err));
      }
    }
    loadInitial();
  }, []);

  // Reactive UI: auto-refresh POS catalogue and dropdowns when data changes anywhere
  useAppEventListener(
    ["products:changed", "categories:changed", "branches:changed", "customers:changed", "inventory:changed"],
    () => {
      loadProducts();
      partyService.listCustomers().then(setCustomers).catch(() => {});
      productService.listCategories().then(setCategories).catch(() => {});
    }
  );


  // When branch changes, reload shift
  const handleBranchChange = (branchId: number) => {
    setSelectedBranchId(branchId);
    loadShift(branchId);
  };

  const loadShift = async (branchId: number) => {
    try {
      const shift = await salesService.getCurrentShift(branchId);
      setCurrentShift(shift);
    } catch (err) {
      setCurrentShift(null);
    }
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const pRes = await productService.listProducts({ size: 100 });
      setProducts(pRes.items || []);
    } catch (err: any) {
      toast.error("Failed to load products: " + err.message);
    } finally {
      setIsLoadingProducts(false);
    }
  };


  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategoryId === 0 || p.category_id === selectedCategoryId;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Add product to cart
  const addToCart = (product: ProductListItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: Number(product.retail_price || 0),
          discount_amount: 0,
          tax_rate: Number(product.tax_rate || 0),
        },
      ];
    });
    toast.success(`Added ${product.name}`, { duration: 1000 });
  };

  // Handle barcode scanner enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === searchQuery.toLowerCase().trim()) ||
        (p.sku && p.sku.toLowerCase() === searchQuery.toLowerCase().trim())
    );

    if (matched) {
      playScanBeep(true);
      addToCart(matched);
      setSearchQuery("");
    } else {
      playScanBeep(false);
      toast.error("No product found with this barcode/SKU");
    }
  };

  // Hardware Barcode Scanner global listener
  useBarcodeScanner({
    onScan: (scannedCode) => {
      const code = scannedCode.trim().toLowerCase();
      const matched = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code) ||
          (p.sku && p.sku.toLowerCase() === code)
      );

      if (matched) {
        playScanBeep(true);
        addToCart(matched);
      } else {
        playScanBeep(false);
        toast.error(`Barcode not found: ${scannedCode}`);
      }
    },
  });


  // Update item quantity
  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove item
  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return cart.reduce((acc, item) => {
      const lineNet = item.unit_price * item.quantity - item.discount_amount;
      return acc + (lineNet * item.tax_rate) / 100;
    }, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, Math.round(subtotal + taxAmount - cartDiscount));
  }, [subtotal, taxAmount, cartDiscount]);

  const changeDue = useMemo(() => {
    const tendered = Number(tenderedAmount) || 0;
    return Math.max(0, tendered - grandTotal);
  }, [tenderedAmount, grandTotal]);

  // Open checkout modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty! Add products to proceed.");
      return;
    }
    setTenderedAmount(String(grandTotal));
    setIsCheckoutModalOpen(true);
  };

  // Process Sale Checkout
  const handleCheckoutSubmit = async () => {
    if (!selectedBranchId) {
      toast.error("Please select a branch first");
      return;
    }

    setIsProcessingSale(true);
    try {
      const isWalkIn = selectedCustomerId === "walk-in";
      const paid = paymentMethod === "credit" ? 0 : (Number(tenderedAmount) || grandTotal);

      const invoice = await salesService.checkout({
        branch_id: selectedBranchId,
        customer_id: isWalkIn ? null : Number(selectedCustomerId),
        customer_name: isWalkIn ? walkInName : undefined,
        customer_phone: isWalkIn ? walkInPhone : undefined,
        customer_ntn_cnic: isWalkIn ? walkInCnic : undefined,
        sale_type: "pos_retail",
        pos_shift_id: currentShift ? currentShift.id : null,
        discount_amount: cartDiscount,
        paid_amount: paid,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          tax_rate: item.tax_rate,
        })),
      });

      toast.success(`Sale completed! Invoice ${invoice.invoice_number}`);
      setLastInvoice(invoice);
      setIsCheckoutModalOpen(false);
      setCart([]);
      setCartDiscount(0);
      try {
        localStorage.removeItem("paperless_pos_cart");
        localStorage.removeItem("paperless_pos_discount");
      } catch (e) {}
      setIsReceiptModalOpen(true);

      // Refresh product stock preview
      loadProducts();
    } catch (err: any) {
      toast.error("Checkout failed: " + (err.detail || err.message || "Unknown error"));
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Stable refs for POS keyboard shortcuts
  const cartLengthRef = useRef(cart.length);
  cartLengthRef.current = cart.length;
  const isCheckoutModalOpenRef = useRef(isCheckoutModalOpen);
  isCheckoutModalOpenRef.current = isCheckoutModalOpen;
  const handleOpenCheckoutRef = useRef(handleOpenCheckout);
  handleOpenCheckoutRef.current = handleOpenCheckout;
  const handleCheckoutSubmitRef = useRef(handleCheckoutSubmit);
  handleCheckoutSubmitRef.current = handleCheckoutSubmit;

  // POS Keyboard Shortcuts (F8 for Charge/Complete Sale)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F8") {
        e.preventDefault();
        e.stopPropagation();
        if (isCheckoutModalOpenRef.current) {
          handleCheckoutSubmitRef.current();
        } else {
          if (cartLengthRef.current === 0) {
            toast.error("Cart is empty! Add products first before charging.");
            return;
          }
          handleOpenCheckoutRef.current();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, []);

  // Open Shift
  const handleOpenShift = async (openingCashAmount: number, notes?: string) => {
    if (!selectedBranchId) return;
    setIsShiftSaving(true);
    try {
      const shift = await salesService.openShift({
        branch_id: selectedBranchId,
        opening_cash: openingCashAmount,
        notes,
      });
      setCurrentShift(shift);
      setIsShiftModalOpen(false);
      toast.success("POS Shift opened successfully!");
    } catch (err: any) {
      toast.error(err.detail || err.message || "Failed to open shift");
    } finally {
      setIsShiftSaving(false);
    }
  };

  // Close Shift
  const handleCloseShift = async (closingCashAmount: number, notes?: string) => {
    if (!currentShift) return;
    setIsShiftSaving(true);
    try {
      const shift = await salesService.closeShift(currentShift.id, {
        closing_cash: closingCashAmount,
        notes,
      });
      setCurrentShift(shift);
      setIsShiftModalOpen(false);
      toast.success("POS Shift closed and reconciled!");
    } catch (err: any) {
      toast.error(err.detail || err.message || "Failed to close shift");
    } finally {
      setIsShiftSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* TOP HEADER: Branch, Shift status & FBR Mode Indicator */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <IconDeviceDesktopAnalytics className="h-5 w-5 text-primary" />
            <span className="font-bold text-base tracking-tight text-foreground">
              POS Counter
            </span>
          </div>

          <div className="h-4 w-[1px] bg-border" />

          {/* Branch Picker */}
          <div className="flex items-center gap-1.5">
            <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedBranchId ? String(selectedBranchId) : ""}
              onValueChange={(val) => handleBranchChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift Indicator */}
          {currentShift && currentShift.status === "open" ? (
            <Badge
              variant="outline"
              className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20"
              onClick={() => setIsShiftModalOpen(true)}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Register Open (Float: Rs {Number(currentShift.opening_cash).toLocaleString()})
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs text-amber-600 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              onClick={() => setIsShiftModalOpen(true)}
            >
              <IconAlertCircle className="h-3.5 w-3.5" />
              Open Register Shift
            </Button>
          )}
        </div>

        {/* FBR Live Badge */}
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border border-primary/20 gap-1 text-xs px-2.5 py-1">
            <IconShieldCheck className="h-3.5 w-3.5 text-primary" />
            FBR Digital Invoicing: <span className="font-semibold">Mock Mode</span>
          </Badge>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: PRODUCT SEARCH & GRID (60% width) */}
        <div className="flex-1 flex flex-col border-r overflow-hidden bg-muted/20">
          {/* Search bar & Barcode Scanner */}
          <div className="p-3 border-b bg-card">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <IconBarcode className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode or type product name / SKU (Press Enter to add)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm" className="h-9 gap-1 text-xs">
                <IconPlus className="h-3.5 w-3.5" />
                Add
              </Button>
            </form>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar">
              <Button
                size="sm"
                variant={selectedCategoryId === 0 ? "default" : "outline"}
                className="h-7 text-xs px-3 rounded-full shrink-0"
                onClick={() => setSelectedCategoryId(0)}
              >
                All Products
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={selectedCategoryId === c.id ? "default" : "outline"}
                  className="h-7 text-xs px-3 rounded-full shrink-0"
                  onClick={() => setSelectedCategoryId(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {isLoadingProducts ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                <IconRefresh className="h-5 w-5 animate-spin" />
                Loading product catalogue...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                <p>No products found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {filteredProducts.map((p) => (
                  <Card
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="cursor-pointer hover:border-primary hover:shadow-sm transition-all group overflow-hidden bg-card"
                  >
                    <CardContent className="p-2.5 space-y-2">
                      {/* Product Image Thumbnail */}
                      <div className="w-full h-24 bg-muted/40 rounded-md overflow-hidden relative border flex items-center justify-center">
                        <img
                          src={p.image_url || DEFAULT_PRODUCT_IMAGE}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith(DEFAULT_PRODUCT_IMAGE)) {
                              target.onerror = null;
                              target.src = DEFAULT_PRODUCT_IMAGE;
                            }
                          }}
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-[9px] text-white px-1.5 py-0.5 rounded font-mono font-semibold">
                          {p.base_unit || "Pcs"}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {p.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                        <span className="truncate">{p.sku || "PRD"}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">{p.category_name}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="font-extrabold text-sm text-foreground font-mono">
                          Rs {Number(p.retail_price || 0).toLocaleString()}
                        </span>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                          <IconPlus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CART & BILL SUMMARY (40% width) */}
        <div className="w-[420px] lg:w-[460px] flex flex-col bg-card shrink-0">
          {/* Customer Selection Row & Khata Details */}
          <div className="border-b bg-muted/20">
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <IconUser className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">
                      Walk-in Retail Buyer (Cash)
                    </SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.business_name} {c.phone ? `(${c.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 px-2 border-dashed shrink-0"
                onClick={() => setIsQuickCustomerOpen(true)}
                title="Register New Customer Account"
              >
                <IconUserPlus className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">New</span>
              </Button>

              {cart.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-1 px-2 shrink-0"
                  onClick={handleClearCart}
                >
                  <IconTrash className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>

            {/* Active Customer Status Banner */}
            {activeCustomer ? (
              <div className="px-3 pb-2.5 pt-0 text-xs flex items-center justify-between border-t border-dashed pt-2 bg-primary/5">
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate flex items-center gap-1">
                    <span>{activeCustomer.business_name}</span>
                    <Badge variant="outline" className="text-[10px] uppercase h-4 px-1 py-0">
                      {activeCustomer.customer_type}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex gap-2">
                    <span>Ph: {activeCustomer.phone || "N/A"}</span>
                    <span>Limit: Rs {Number(activeCustomer.credit_limit || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-muted-foreground block">Ledger / Khata</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-mono font-bold",
                      Number(activeCustomer.current_balance) > 0
                        ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    )}
                  >
                    Rs {Number(activeCustomer.current_balance || 0).toLocaleString()}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="px-3 py-1 bg-muted/40 border-t border-dashed flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">Walk-in</Badge>
                  Counter Retail Cash Sale
                </span>
                <span className="text-[10px] text-muted-foreground/80">No khata recorded</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto divide-y">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-xs p-6 text-center space-y-2">
                <IconBarcode className="h-10 w-10 text-muted-foreground/40" />
                <p className="font-medium">Cart is empty</p>
                <p className="text-[11px] text-muted-foreground/70">
                  Scan a barcode or click products from the catalogue on the left to start billing.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const lineTotal =
                  item.unit_price * item.quantity - item.discount_amount;
                return (
                  <div
                    key={item.product.id}
                    className="p-2.5 flex items-center justify-between gap-2.5 hover:bg-muted/20 transition-colors"
                  >
                    {/* Item Image Thumbnail */}
                    <div className="w-10 h-10 rounded-md bg-muted/40 overflow-hidden shrink-0 border flex items-center justify-center">
                      <img
                        src={item.product.image_url || DEFAULT_PRODUCT_IMAGE}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.endsWith(DEFAULT_PRODUCT_IMAGE)) {
                            target.onerror = null;
                            target.src = DEFAULT_PRODUCT_IMAGE;
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Rs {item.unit_price.toLocaleString()} × {item.quantity}{" "}
                        {item.product.base_unit || "Pcs"}
                      </p>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6 rounded-md"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <IconMinus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold text-xs min-w-[24px] text-center font-mono">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6 rounded-md"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <IconPlus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Line Total & Remove */}
                    <div className="text-right min-w-[70px]">
                      <p className="font-bold text-xs text-foreground">
                        Rs {lineTotal.toLocaleString()}
                      </p>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-rose-600 rounded"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <IconTrash className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* BILL SUMMARY & CHECKOUT BUTTON */}
          <div className="p-4 border-t bg-muted/10 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({cart.length} items)</span>
                <span>Rs {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Sales Tax (FBR 18% / 3rd Sched.)</span>
                <span>Rs {taxAmount.toLocaleString()}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Special Discount</span>
                  <span>- Rs {cartDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="h-[1px] bg-border my-1" />
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold text-sm text-foreground">
                  Grand Total
                </span>
                <span className="font-bold text-xl text-primary font-mono">
                  Rs {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-12 text-sm font-bold justify-between bg-primary text-primary-foreground hover:bg-primary/90 shadow-md px-4"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
            >
              <div className="flex items-center gap-2">
                <IconReceiptTax className="h-5 w-5" />
                <span>Charge Rs {grandTotal.toLocaleString()}</span>
              </div>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-primary-foreground/20 rounded text-primary-foreground border border-primary-foreground/30 shadow-xs">
                F8
              </kbd>
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL: CHECKOUT & TENDER DIALOG */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <IconCash className="h-5 w-5 text-primary" />
              Complete Payment & Fiscalize
            </DialogTitle>
            <DialogDescription>
              Collect customer payment and send real-time invoice to FBR.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Amount Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Amount Payable
              </span>
              <p className="text-3xl font-extrabold text-primary font-mono">
                Rs {grandTotal.toLocaleString()}
              </p>
            </div>

            {/* Payment Method Tabs */}
            <Tabs
              value={paymentMethod}
              onValueChange={(val) => setPaymentMethod(val as any)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="cash" className="gap-1.5 text-xs">
                  <IconCash className="h-4 w-4" />
                  Cash
                </TabsTrigger>
                <TabsTrigger value="card" className="gap-1.5 text-xs">
                  <IconCreditCard className="h-4 w-4" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="credit" className="gap-1.5 text-xs">
                  <IconUser className="h-4 w-4" />
                  Credit / Khata
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Cash Tender Inputs */}
            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {[grandTotal, 1000, 2000, 5000].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs font-mono"
                      onClick={() => setTenderedAmount(String(amt))}
                    >
                      {amt === grandTotal ? "Exact" : `Rs ${amt.toLocaleString()}`}
                    </Button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                    <span>Cash Tendered (Rs)</span>
                    <span className="text-[11px] text-muted-foreground">Press Enter to complete</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter cash received..."
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCheckoutSubmit();
                      }
                    }}
                    className="text-lg font-bold font-mono h-11"
                    autoFocus
                  />
                </div>

                {/* Change Returned Banner */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <span className="text-xs font-medium">Change to return:</span>
                  <span className="text-lg font-bold font-mono">
                    Rs {changeDue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* FBR Compliance Notice */}
            <div className="rounded-lg bg-muted/40 p-2.5 border text-xs text-muted-foreground flex items-center gap-2">
              <IconShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                FBR Fiscal QR and Invoice Number will be auto-generated in Mock Mode.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCheckoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCheckoutSubmit}
              disabled={isProcessingSale}
              className="gap-2 font-bold"
            >
              {isProcessingSale && <IconRefresh className="h-4 w-4 animate-spin" />}
              <span>{isProcessingSale ? "Processing FBR..." : "Finish & Print Receipt"}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-primary-foreground/20 rounded font-mono border border-primary-foreground/30">
                F8 / Enter
              </kbd>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ENTERPRISE DUAL-MODE THERMAL RECEIPT MODAL (80mm & 58mm, Urdu + English, FBR & WhatsApp) */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={lastInvoice}
        customer={activeCustomer}
        shopName={tenant?.name || "Paperless Enterprise"}
        branchName={branches.find((b) => b.id === selectedBranchId)?.name || "Main Branch"}
        branchAddress={branches.find((b) => b.id === selectedBranchId)?.address || "Commercial Area, Pakistan"}
        branchPhone={branches.find((b) => b.id === selectedBranchId)?.phone || "+92 300 1234567"}
      />

      {/* POS REGISTER SHIFT MANAGEMENT & VARIANCE RECONCILIATION */}
      <ShiftReconciliationModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shift={currentShift}
        branchName={branches.find((b) => b.id === selectedBranchId)?.name || "Main Branch"}
        onOpenShift={handleOpenShift}
        onCloseShift={handleCloseShift}
      />

      {/* MODAL: QUICK ADD CUSTOMER */}
      <Dialog open={isQuickCustomerOpen} onOpenChange={setIsQuickCustomerOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleQuickAddCustomer}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <IconUserPlus className="h-5 w-5 text-primary" />
                Quick Register Customer
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add a new customer account directly from the POS counter.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label htmlFor="quickCustName" className="text-xs font-semibold">
                  Shop / Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quickCustName"
                  placeholder="e.g. Bismillah General Store"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 min-w-0">
                  <Label htmlFor="quickCustPhone" className="text-xs font-semibold">
                    Phone Number
                  </Label>
                  <Input
                    id="quickCustPhone"
                    placeholder="0300-1234567"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <Label htmlFor="quickCustType" className="text-xs font-semibold">
                    Customer Type
                  </Label>
                  <Select value={newCustType} onValueChange={setNewCustType}>
                    <SelectTrigger id="quickCustType" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retailer">Retailer (Dukan)</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="quickCreditLimit" className="text-xs font-semibold">
                  Credit / Khata Limit (PKR)
                </Label>
                <Input
                  id="quickCreditLimit"
                  type="number"
                  placeholder="e.g. 50000"
                  value={newCustCreditLimit}
                  onChange={(e) => setNewCustCreditLimit(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQuickCustomerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSavingCustomer}>
                {isSavingCustomer ? "Saving..." : "Create & Select"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
