import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatLkr } from "@/lib/currency";
import { resolveMediaUrl } from "@/lib/imageUrl";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

const formatCurrency = formatLkr;

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, cartCount, loading, refreshCart, updateCartItemQuantity, removeCartItem } = useCart();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");

  const hasItems = items.length > 0;
  const availableItems = useMemo(() => items.filter((item) => item.isAvailable), [items]);

  useEffect(() => {
    setShippingAddress(user?.address || "");
  }, [user?.address]);

  const handleCheckout = async () => {
    if (!availableItems.length) return;

    const normalizedAddress = shippingAddress.trim();
    if (!normalizedAddress) {
      setError("Please add a shipping address to place your order.");
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");
      setMessage("");

      for (const item of availableItems) {
        await api.post("/orders", {
          productId: item.productId,
          qty: item.quantity,
          shippingAddress: normalizedAddress,
          paymentMethod: "Cash on Delivery",
        });
      }

      // Remove purchased items from cart
      for (const item of availableItems) {
        await api.delete(`/cart/${item._id}`);
      }

      await refreshCart();
      setMessage("Order placed successfully.");
      navigate("/my-orders");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    try {
      setBusyItemId(cartItemId);
      setError("");
      setMessage("");
      const nextMessage = await updateCartItemQuantity(cartItemId, quantity);
      setMessage(nextMessage);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update cart quantity");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    try {
      setBusyItemId(cartItemId);
      setError("");
      setMessage("");
      const nextMessage = await removeCartItem(cartItemId);
      setMessage(nextMessage);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove product from cart");
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Cart</h1>
          <p className="text-sm text-muted-foreground">
            Review saved products, adjust quantities, and keep your cart ready for checkout.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {cartCount} item{cartCount === 1 ? "" : "s"} in cart
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {loading ? (
            <Card className="glass-card">
              <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading cart...
              </CardContent>
            </Card>
          ) : null}

          {!loading && !hasItems ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground">
                    Add products from the product page to see them here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!loading &&
            items.map((item) => {
              const isBusy = busyItemId === item._id;
              const imageSrc = resolveMediaUrl(item.productImage, "https://placehold.co/200x200?text=Product");

              return (
                <Card key={item._id} className="glass-card">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="h-28 w-full overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-28">
                        <img src={imageSrc} alt={item.productName} className="h-full w-full object-cover" />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold text-foreground">{item.productName}</h2>
                            <p className="text-sm text-muted-foreground">
                              Price: {formatCurrency(item.productPrice)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleRemove(item._id)}
                            className="gap-2 self-start"
                          >
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Remove
                          </Button>
                        </div>

                        {!item.isAvailable ? (
                          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{item.unavailableMessage || "This product is currently unavailable"}</span>
                          </div>
                        ) : null}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="inline-flex items-center rounded-lg border border-border">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isBusy || item.quantity <= 1 || !item.isAvailable}
                              onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <div className="min-w-[52px] px-3 text-center text-sm font-semibold">
                              {isBusy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : item.quantity}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={
                                isBusy ||
                                !item.isAvailable ||
                                (typeof item.availableStock === "number" && item.quantity >= item.availableStock)
                              }
                              onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            Quantity: <span className="font-medium text-foreground">{item.quantity}</span>
                          </div>

                          <div className="text-base font-semibold text-foreground">
                            Total: {formatCurrency(item.totalAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        <Card className="glass-card h-fit">
          <CardHeader>
            <CardTitle>Cart Summary</CardTitle>
            <CardDescription>
              {availableItems.length} available item{availableItems.length === 1 ? "" : "s"} ready in your cart.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cart Count</span>
              <span className="font-medium text-foreground">{cartCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4 text-base font-semibold">
              <span>Total Amount</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-address" className="text-sm">
                Shipping Address
              </Label>
              <Textarea
                id="shipping-address"
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
                placeholder="Enter your full delivery address"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {user?.address
                  ? "You can edit this address here before checkout."
                  : "Tip: Add an address in your profile for faster checkout."}
              </p>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={!availableItems.length || placingOrder}
              onClick={handleCheckout}
            >
              {placingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Proceed to Checkout
            </Button>
            {!availableItems.length && hasItems ? (
              <p className="text-xs text-muted-foreground">
                Remove unavailable items or wait until the product becomes available again.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
