import React, { useState } from "react";
import { ShoppingCart, Package, Plus, Minus, X, CheckCheck, Loader2, User, Phone, MapPin } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
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

  const totalAmount = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-vendeur-coal border border-white/10 w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <header className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ShoppingCart size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">Créer une Commande</h2>
              <p className="text-xs text-white/40 font-medium">Sélectionnez les articles et configurez la commande du client.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors rounded-xl hover:bg-white/5">
            <X size={24} />
          </button>
        </header>

        {/* Customer & Delivery Form for Direct Order */}
        {!initialCustomerId && (
          <div className="px-6 md:px-8 py-4 bg-white/[0.02] border-b border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5 mb-1.5">
                <User size={12} className="text-emerald-400" />
                Sélectionner un Client
              </label>
              {customers.length > 0 ? (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const matched = customers.find((c: any) => c._id === e.target.value);
                    if (matched) {
                      setPhone(matched.phone || "");
                      if (matched.location) setShippingAddress(matched.location);
                    }
                  }}
                  className="w-full bg-vendeur-coal border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choisir un client existant --</option>
                  {customers.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name ? `${c.name} (${c.phone})` : c.phone}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Numéro WhatsApp (+225...)"
                    className="w-full bg-vendeur-coal border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5 mb-1.5">
                <MapPin size={12} className="text-emerald-400" />
                Lieu de Livraison / Quartier
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Ex: Cocody Angré, Marcory..."
                className="w-full bg-vendeur-coal border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0">
          {/* Product List */}
          <div className="p-6 border-r border-white/5 overflow-y-auto space-y-3 bg-black/20">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Catalogue</h3>
            {loadingProducts ? (
              <div className="py-12 flex justify-center text-white/20">
                <Loader2 className="animate-spin text-emerald-400" size={28} />
              </div>
            ) : products.length === 0 ? (
              <p className="text-xs text-white/20 italic py-8 text-center">Aucun produit dans le catalogue.</p>
            ) : (
              products.map((p: any) => (
                <button
                  key={p._id}
                  onClick={() => handleAddItem(p)}
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/50 hover:bg-white/[0.08] transition-all text-left flex items-center gap-3 group"
                >
                  {p.images?.[0] ? (
                    <img src={p.images[0]} className="h-10 w-10 rounded-xl object-cover" alt="" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Package className="text-white/20" size={18} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate text-white group-hover:text-emerald-400">{p.name}</p>
                    <p className="text-[11px] font-black text-white/40">{p.price.toLocaleString()} {p.currency || merchantCurrency}</p>
                  </div>
                  <Plus size={16} className="text-white/20 group-hover:text-emerald-400 shrink-0" />
                </button>
              ))
            )}
          </div>

          {/* Cart & Total */}
          <div className="p-6 flex flex-col bg-vendeur-coal overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Articles Sélectionnés</h3>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {selectedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-12">
                  <ShoppingCart size={40} className="mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest">Panier vide</p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-white/40">{item.price.toLocaleString()} {merchantCurrency}</p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="p-1 rounded-md text-white/40 hover:text-rose-400 hover:bg-white/5"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-xs font-black text-emerald-400 w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleAddItem({ _id: item.productId, name: item.name, price: item.price })}
                        className="p-1 rounded-md text-white/40 hover:text-emerald-400 hover:bg-white/5"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-white/10 mt-4 space-y-3 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total de la commande</span>
                <span className="text-xl font-black text-emerald-400">{totalAmount.toLocaleString()} {merchantCurrency}</span>
              </div>
              <button
                disabled={selectedItems.length === 0 || createOrderMutation.isPending || isCreatingCustomer}
                onClick={handleValidateOrder}
                className="w-full h-12 bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-20"
              >
                {createOrderMutation.isPending || isCreatingCustomer ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CheckCheck size={18} />
                )}
                Confirmer la Commande
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
