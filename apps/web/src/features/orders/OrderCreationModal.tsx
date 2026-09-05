import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingCart, Package, Plus, Minus, X, CheckCheck, Loader2, User, Phone, MapPin, Search, ChevronDown, Check, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import { CustomerAvatar } from "@/features/inbox/components/CustomerAvatar";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import { toast } from "sonner";

interface OrderCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  customerPhone?: string;
  conversationId?: string;
  initialDeliveryAddress?: string;
}

export function OrderCreationModal({
  isOpen,
  onClose,
  customerId: initialCustomerId,
  customerPhone: initialCustomerPhone,
  conversationId,
  initialDeliveryAddress = ""
}: OrderCreationModalProps) {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [phone, setPhone] = useState(initialCustomerPhone || "");
  const [shippingAddress, setShippingAddress] = useState(initialDeliveryAddress);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isManualPhoneMode, setIsManualPhoneMode] = useState(!initialCustomerId && !initialCustomerPhone);
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  const queryClient = useQueryClient();
  const merchantCurrency = useMerchantCurrency();

  // Fetch Products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/products");
      return res.data;
    },
    enabled: isOpen
  });

  // Fetch Customers if no customerId is provided
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/customers");
      return res.data;
    },
    enabled: isOpen && !initialCustomerId
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || "");

  const selectedCustomer = customers.find((c: any) => c._id === selectedCustomerId);

  const filteredCustomers = customers.filter((c: any) => {
    const query = searchCustomer.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = c.name && c.name.toLowerCase().includes(query);
    const phoneMatch = c.phone && c.phone.includes(query);
    const locationMatch = c.location && c.location.toLowerCase().includes(query);
    return nameMatch || phoneMatch || locationMatch;
  });

  const totalAmount = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItemCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiClient.post("/api/commerce/orders", {
        ...orderData,
        currency: merchantCurrency
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Commande créée avec succès ! ✨");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Échec de la validation de la commande.");
    }
  });

  const handleAddItem = (product: any) => {
    const existing = selectedItems.find(i => i.productId === product._id);
    if (existing) {
      setSelectedItems(selectedItems.map(i =>
        i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const handleRemoveItem = (productId: string) => {
    const existing = selectedItems.find(i => i.productId === productId);
    if (existing?.quantity === 1) {
      setSelectedItems(selectedItems.filter(i => i.productId !== productId));
    } else {
      setSelectedItems(selectedItems.map(i =>
        i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
      ));
    }
  };

  const handleValidateOrder = async () => {
    let finalCustomerId = selectedCustomerId;

    if (!finalCustomerId) {
      if (!phone.trim()) {
        toast.error("Veuillez sélectionner un client ou saisir un numéro de téléphone.");
        return;
      }

      // Proactively create or find customer by phone
      try {
        setIsCreatingCustomer(true);
        const res = await apiClient.post("/api/commerce/customers/lookup-or-create", {
          phone: phone.trim(),
          location: shippingAddress.trim()
        }).catch(async () => {
          return null;
        });

        if (res?.data?._id) {
          finalCustomerId = res.data._id;
        }
      } catch (e) {
        // Continue
      } finally {
        setIsCreatingCustomer(false);
      }
    }

    if (!finalCustomerId && !initialCustomerId) {
      toast.error("Veuillez sélectionner un client valide.");
      return;
    }

    createOrderMutation.mutate({
      customerId: finalCustomerId || initialCustomerId,
      conversationId,
      items: selectedItems,
      totalAmount,
      currency: merchantCurrency,
      shippingAddress: shippingAddress.trim() || undefined,
      deliveryAddress: shippingAddress.trim() || undefined,
      status: "pending"
    });
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchProduct.toLowerCase()))
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B1512] border-t sm:border border-slate-200 dark:border-white/10 w-full max-w-3xl h-[94vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 text-slate-900 dark:text-white">
        
        {/* Mobile Pull Handle */}
        <div className="sm:hidden w-full flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        {/* Header */}
        <header className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-white/[0.02] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShoppingCart size={22} className="shrink-0" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                Nouvelle Commande
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-white/40 font-medium truncate">
                Sélectionnez les articles et saisissez les coordonnées.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white flex items-center justify-center shrink-0 transition-colors active:scale-95"
            title="Fermer"
          >
            <X size={18} className="shrink-0" />
          </button>
        </header>

        {/* Customer & Delivery Form for Direct Order */}
        {!initialCustomerId && (
          <div className="p-4 sm:px-6 sm:py-3.5 bg-slate-50/80 dark:bg-white/[0.01] border-b border-slate-200 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 relative">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/50 flex items-center gap-1.5">
                  <User size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Client
                </label>
                {customers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualPhoneMode(!isManualPhoneMode);
                      if (!isManualPhoneMode) {
                        setSelectedCustomerId("");
                      }
                    }}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400/80 hover:text-emerald-500 dark:hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    {isManualPhoneMode ? (
                      <>
                        <User size={10} /> Choisir existant
                      </>
                    ) : (
                      <>
                        <UserPlus size={10} /> + Nouveau numéro
                      </>
                    )}
                  </button>
                )}
              </div>

              {!isManualPhoneMode && customers.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className="w-full h-11 bg-slate-100 dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs text-slate-900 dark:text-white flex items-center justify-between gap-2 hover:border-slate-300 dark:hover:border-white/20 transition-colors text-left"
                  >
                    {selectedCustomer ? (
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <CustomerAvatar
                          name={selectedCustomer.name}
                          phone={selectedCustomer.phone}
                          avatarUrl={selectedCustomer.avatarUrl}
                          platform={selectedCustomer.platform || "whatsapp"}
                          size="sm"
                          showPlatformBadge={false}
                        />
                        <div className="min-w-0 flex-1 truncate">
                          <span className="font-bold text-slate-900 dark:text-white truncate block">
                            {selectedCustomer.name || formatDisplayPhone(selectedCustomer.phone, "CI")}
                          </span>
                          {selectedCustomer.name && (
                            <span className="text-[10px] text-slate-500 dark:text-white/40 font-mono block truncate">
                              {formatDisplayPhone(selectedCustomer.phone, "CI")}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-white/40 flex items-center gap-2">
                        <Search size={14} className="text-slate-400 dark:text-white/20" />
                        Choisir un client...
                      </span>
                    )}
                    <ChevronDown size={14} className={`text-slate-400 dark:text-white/40 shrink-0 transition-transform ${isCustomerDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isCustomerDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsCustomerDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0c1613] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden max-h-64 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                            <input
                              type="text"
                              value={searchCustomer}
                              onChange={(e) => setSearchCustomer(e.target.value)}
                              placeholder="Rechercher nom, numéro..."
                              className="w-full h-8 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-white/20"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="overflow-y-auto max-h-48 divide-y divide-slate-100 dark:divide-white/5 p-1">
                          {filteredCustomers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 dark:text-white/30">
                              Aucun client trouvé.
                            </div>
                          ) : (
                            filteredCustomers.map((c: any) => {
                              const isSelected = selectedCustomerId === c._id;
                              const cleanPhone = (c.phone || "").replace(/@s\.whatsapp\.net|@c\.us/g, "");
                              return (
                                <button
                                  key={c._id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomerId(c._id);
                                    setPhone(cleanPhone);
                                    if (c.location) setShippingAddress(c.location);
                                    setIsCustomerDropdownOpen(false);
                                  }}
                                  className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-colors ${
                                    isSelected ? "bg-emerald-500/15 border border-emerald-500/30 text-slate-900 dark:text-white" : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white/80"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <CustomerAvatar
                                      name={c.name}
                                      phone={c.phone}
                                      avatarUrl={c.avatarUrl}
                                      platform={c.platform || "whatsapp"}
                                      size="sm"
                                      showPlatformBadge={false}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                        {c.name || formatDisplayPhone(cleanPhone, "CI") || "Client"}
                                      </div>
                                      <div className="text-[10px] text-slate-500 dark:text-white/40 font-mono truncate flex items-center gap-1.5">
                                        {c.name && <span>{formatDisplayPhone(cleanPhone, "CI")}</span>}
                                        {c.location && (
                                          <span className="text-emerald-600 dark:text-emerald-400/80 flex items-center gap-0.5">
                                            • <MapPin size={9} /> {c.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 shrink-0" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Numéro WhatsApp (+225 07...)"
                    className="w-full h-11 bg-slate-100 dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/50 flex items-center gap-1.5 mb-1.5">
                <MapPin size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                Lieu de Livraison
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Ex: Cocody Angré, Marcory, Yopougon..."
                className="w-full h-11 bg-slate-100 dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Mobile View Toggle */}
        <div className="flex md:hidden border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] px-3 shrink-0">
          <button
            onClick={() => setMobileTab("catalog")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
              mobileTab === "catalog"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-400 dark:text-white/40"
            }`}
          >
            <Package size={14} className="shrink-0" />
            <span>Catalogue</span>
          </button>

          <button
            onClick={() => setMobileTab("cart")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
              mobileTab === "cart"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-400 dark:text-white/40"
            }`}
          >
            <ShoppingCart size={14} className="shrink-0" />
            <span>Panier ({totalItemCount})</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0 overflow-hidden">
          
          {/* Product List / Catalog */}
          <div className={`p-4 sm:p-6 border-r border-slate-200 dark:border-white/5 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-black/20 flex flex-col ${
            mobileTab === "catalog" ? "flex" : "hidden md:flex"
          }`}>
            <div className="flex items-center justify-between gap-2 shrink-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Catalogue Produits</h3>
              <span className="text-[10px] text-slate-500 dark:text-white/40">{filteredProducts.length} articles</span>
            </div>

            {/* Quick Search */}
            <div className="relative shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 shrink-0" />
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Rechercher un article..."
                className="w-full h-10 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {loadingProducts ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-white/40 gap-2">
                  <Loader2 className="animate-spin text-emerald-500 shrink-0" size={24} />
                  <p className="text-xs">Chargement du catalogue...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-white/30 italic py-8 text-center">Aucun produit trouvé.</p>
              ) : (
                filteredProducts.map((p: any) => {
                  const selected = selectedItems.find(i => i.productId === p._id);
                  return (
                    <div
                      key={p._id}
                      className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 shadow-sm dark:shadow-none"
                    >
                      {p.images?.[0] ? (
                        <img src={p.images[0]} className="h-11 w-11 rounded-xl object-cover shrink-0" alt="" />
                      ) : (
                        <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/5">
                          <Package className="text-slate-400 dark:text-white/30 shrink-0" size={18} />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 pt-0.5">
                          {p.price.toLocaleString()} {p.currency || merchantCurrency}
                        </p>
                      </div>

                      {selected ? (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-1 shrink-0">
                          <button
                            onClick={() => handleRemoveItem(p._id)}
                            className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-rose-500/20 text-slate-700 dark:text-white flex items-center justify-center active:scale-95 shrink-0"
                          >
                            <Minus size={13} className="shrink-0" />
                          </button>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 w-5 text-center shrink-0">
                            {selected.quantity}
                          </span>
                          <button
                            onClick={() => handleAddItem(p)}
                            className="w-8 h-8 rounded-lg bg-emerald-500 text-white dark:text-black flex items-center justify-center active:scale-95 shrink-0"
                          >
                            <Plus size={13} className="shrink-0 font-bold" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddItem(p)}
                          className="h-9 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white dark:hover:text-black text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                        >
                          <Plus size={14} className="shrink-0" />
                          <span>Ajouter</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cart & Total */}
          <div className={`p-4 sm:p-6 flex flex-col bg-slate-50 dark:bg-vendeur-coal overflow-hidden ${
            mobileTab === "cart" ? "flex" : "hidden md:flex"
          }`}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Articles Sélectionnés</h3>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {totalItemCount} article{totalItemCount > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {selectedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12 space-y-2">
                  <ShoppingCart size={36} className="shrink-0 text-slate-400 dark:text-white/50" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white">Panier vide</p>
                  <p className="text-[11px] text-slate-500 dark:text-white/50 max-w-[200px]">Sélectionnez des articles dans le catalogue pour composer la commande.</p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400/90">{item.price.toLocaleString()} {merchantCurrency}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-rose-500/20 text-slate-600 dark:text-white/70 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center active:scale-95 shrink-0"
                      >
                        <Minus size={13} className="shrink-0" />
                      </button>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 w-5 text-center shrink-0">{item.quantity}</span>
                      <button
                        onClick={() => handleAddItem({ _id: item.productId, name: item.name, price: item.price })}
                        className="w-8 h-8 rounded-lg bg-emerald-500 text-white dark:text-black flex items-center justify-center active:scale-95 shrink-0"
                      >
                        <Plus size={13} className="shrink-0 font-bold" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Checkout Action */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 mt-4 space-y-3 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-wider">Total Commande</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalAmount.toLocaleString()} {merchantCurrency}</span>
              </div>
              
              <button
                disabled={selectedItems.length === 0 || createOrderMutation.isPending || isCreatingCustomer}
                onClick={handleValidateOrder}
                className="w-full h-12 sm:h-14 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-black font-black uppercase tracking-wider text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-20"
              >
                {createOrderMutation.isPending || isCreatingCustomer ? (
                  <Loader2 className="animate-spin shrink-0" size={18} />
                ) : (
                  <CheckCheck size={18} className="shrink-0" />
                )}
                <span>Confirmer la Commande</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
