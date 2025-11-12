# Hướng Dẫn Giỏ Hàng LocalStorage

## Tổng Quan

Chức năng giỏ hàng đã được cập nhật để hoạt động hoàn toàn với **localStorage** mà không cần kết nối backend. Tất cả dữ liệu giỏ hàng được lưu trữ trên trình duyệt của người dùng.

## ✅ Tính Năng

- ✅ Thêm sản phẩm vào giỏ hàng
- ✅ Cập nhật số lượng sản phẩm
- ✅ Xóa sản phẩm khỏi giỏ hàng
- ✅ Xóa tất cả sản phẩm
- ✅ Hiển thị số lượng items trên topbar
- ✅ Kiểm tra tồn kho
- ✅ Tính toán tổng tiền tự động
- ✅ Lưu trữ vĩnh viễn trên localStorage
- ✅ Hoạt động offline (không cần backend)

## Cấu Trúc Dữ Liệu

### Cart Interface

```typescript
interface Cart {
  items: CartItem[];
  total_items: number; // Tổng số lượng (sum của quantity)
  total_price: number; // Tổng giá trị giỏ hàng
  items_count: number; // Số loại sản phẩm khác nhau
}
```

### CartItem Interface

```typescript
interface CartItem {
  id: number; // ID của cart item (timestamp)
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    old_price?: number;
    main_image?: string;
    main_image_url?: string;
    stock: number;
    unit: string;
    category_name: string;
  };
  quantity: number;
  price: number; // Giá tại thời điểm thêm vào giỏ
  subtotal: number; // quantity * price
}
```

## Sử Dụng CartContext

### 1. Import Hook

```typescript
import { useCart } from "@/layout/context/cartcontext";
```

### 2. Sử Dụng trong Component

```typescript
const {
  cart, // Dữ liệu giỏ hàng
  loading, // Trạng thái loading
  addToCart, // Thêm sản phẩm
  updateCartItem, // Cập nhật số lượng
  removeFromCart, // Xóa sản phẩm
  clearCart, // Xóa tất cả
  refreshCart, // Làm mới giỏ hàng
  getCartCount, // Lấy tổng số items
} = useCart();
```

### 3. Ví Dụ: Thêm Sản Phẩm

```typescript
const handleAddToCart = async (product: Product) => {
  try {
    await addToCart(product, 1); // Thêm 1 sản phẩm
    toast.show({
      severity: "success",
      summary: "Thành công",
      detail: "Đã thêm vào giỏ hàng",
    });
  } catch (error) {
    toast.show({
      severity: "error",
      summary: "Lỗi",
      detail: error.message,
    });
  }
};
```

### 4. Ví Dụ: Cập Nhật Số Lượng

```typescript
const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
  try {
    await updateCartItem(productId, newQuantity);
    toast.show({
      severity: "success",
      summary: "Đã cập nhật",
    });
  } catch (error) {
    toast.show({
      severity: "error",
      summary: "Lỗi",
      detail: error.message,
    });
  }
};
```

### 5. Ví Dụ: Xóa Sản Phẩm

```typescript
const handleRemove = async (productId: number) => {
  try {
    await removeFromCart(productId);
    toast.show({
      severity: "success",
      summary: "Đã xóa",
    });
  } catch (error) {
    toast.show({
      severity: "error",
      summary: "Lỗi",
    });
  }
};
```

### 6. Hiển Thị Số Lượng

```typescript
const cartCount = getCartCount();

return <Badge value={cartCount} severity="danger" />;
```

## Các Trang Đã Tích Hợp

### 1. Trang Sản Phẩm (`/customer/products`)

**File:** `frontend/app/(main)/customer/products/page.tsx`

**Tính năng:**

- Hiển thị danh sách sản phẩm
- Nút "Thêm vào giỏ" trên mỗi sản phẩm
- Hiển thị tổng số items trong giỏ
- Toast notification khi thêm thành công/thất bại

### 2. Trang Chi Tiết Sản Phẩm (`/customer/products/[slug]`)

**Tính năng:**

- Chọn số lượng trước khi thêm
- Kiểm tra tồn kho
- Hiển thị thông báo

### 3. Trang Giỏ Hàng (`/customer/cart`)

**File:** `frontend/app/(main)/customer/cart/page.tsx`

**Tính năng:**

- Hiển thị danh sách sản phẩm trong giỏ
- Tăng/giảm số lượng với InputNumber
- Xóa từng sản phẩm
- Xóa tất cả sản phẩm
- Tính toán tổng tiền
- Hiển thị phí vận chuyển (miễn phí với đơn ≥ 500k)
- Ghi chú đơn hàng

### 4. Topbar (Thanh điều hướng)

**File:** `frontend/layout/AppTopbar.tsx`

**Tính năng:**

- Hiển thị icon giỏ hàng
- Badge số lượng items
- Link đến trang giỏ hàng

## Xử Lý Lỗi

### 1. Kiểm Tra Tồn Kho

```typescript
if (newQuantity > product.stock) {
  throw new Error(`Chỉ còn ${product.stock} ${product.unit} trong kho`);
}
```

### 2. Sản Phẩm Không Tồn Tại

```typescript
if (itemIndex < 0) {
  throw new Error("Sản phẩm không tồn tại trong giỏ hàng");
}
```

### 3. Số Lượng ≤ 0

```typescript
if (quantity <= 0) {
  return await removeFromCart(productId);
}
```

## LocalStorage

### Key Storage

```typescript
const CART_STORAGE_KEY = "shopping_cart";
```

### Cấu Trúc Dữ Liệu Lưu Trữ

```json
{
  "items": [
    {
      "id": 1699876543210,
      "product": {
        "id": 1,
        "name": "Thịt bò Úc",
        "slug": "thit-bo-uc",
        "price": 250000,
        "stock": 50,
        "unit": "kg",
        "category_name": "Thịt"
      },
      "quantity": 2,
      "price": 250000,
      "subtotal": 500000
    }
  ],
  "total_items": 2,
  "total_price": 500000,
  "items_count": 1
}
```

### Đọc Dữ Liệu

```typescript
const savedCart = localStorage.getItem(CART_STORAGE_KEY);
if (savedCart) {
  const cart = JSON.parse(savedCart);
}
```

### Lưu Dữ Liệu

```typescript
localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
```

### Xóa Dữ Liệu

```typescript
localStorage.removeItem(CART_STORAGE_KEY);
```

## Tính Toán Tự Động

### Tính Tổng

```typescript
const calculateCartTotals = (items: CartItem[]): Cart => {
  const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
  const total_price = items.reduce((sum, item) => sum + item.subtotal, 0);
  const items_count = items.length;

  return {
    items,
    total_items,
    total_price,
    items_count,
  };
};
```

### Tính Subtotal

```typescript
const subtotal = quantity * price;
```

### Tính Phí Vận Chuyển

```typescript
const calculateShipping = () => {
  const subtotal = cart?.total_price || 0;
  return subtotal >= 500000 ? 0 : 30000;
};
```

## Testing

### 1. Test Thêm Sản Phẩm

1. Vào trang sản phẩm: `/customer/products`
2. Click vào icon giỏ hàng trên một sản phẩm
3. Kiểm tra:
   - Toast hiển thị "Đã thêm vào giỏ"
   - Badge trên topbar tăng lên
   - Dữ liệu lưu trong localStorage

### 2. Test Cập Nhật Số Lượng

1. Vào trang giỏ hàng: `/customer/cart`
2. Thay đổi số lượng bằng InputNumber
3. Kiểm tra:
   - Số lượng được cập nhật
   - Tổng tiền thay đổi
   - localStorage được cập nhật

### 3. Test Xóa Sản Phẩm

1. Vào trang giỏ hàng
2. Click nút xóa (icon thùng rác)
3. Confirm dialog xuất hiện
4. Click "Có"
5. Kiểm tra:
   - Sản phẩm bị xóa khỏi danh sách
   - Badge giảm xuống
   - localStorage được cập nhật

### 4. Test Xóa Tất Cả

1. Vào trang giỏ hàng
2. Click "Xóa tất cả"
3. Confirm dialog xuất hiện
4. Click "Có"
5. Kiểm tra:
   - Giỏ hàng trống
   - Badge = 0
   - localStorage bị xóa

### 5. Test Kiểm Tra Tồn Kho

1. Thêm sản phẩm vào giỏ với số lượng = stock
2. Thử thêm lại sản phẩm đó
3. Kiểm tra:
   - Toast hiển thị lỗi "Chỉ còn X trong kho"
   - Số lượng không tăng

## Ưu Điểm

✅ **Không cần backend**: Hoạt động độc lập, không cần server
✅ **Nhanh**: Không có độ trễ mạng
✅ **Offline**: Hoạt động khi không có internet
✅ **Tự động lưu**: Giữ giỏ hàng khi tải lại trang
✅ **Đơn giản**: Dễ debug và maintain
✅ **Cross-tab**: Có thể sync giữa các tab (nếu implement)

## Nhược Điểm

⚠️ **Không đồng bộ**: Mỗi thiết bị có giỏ hàng riêng
⚠️ **Giới hạn dung lượng**: LocalStorage có giới hạn ~5-10MB
⚠️ **Không bảo mật**: Dữ liệu có thể bị xem/sửa
⚠️ **Mất dữ liệu**: Clear cache = mất giỏ hàng
⚠️ **Không có backup**: Không thể khôi phục nếu mất

## Nâng Cấp Tương Lai

### 1. Sync Với Backend (Tùy Chọn)

Có thể thêm chức năng đồng bộ khi user đăng nhập:

```typescript
const syncCartWithServer = async () => {
  const localCart = getCartFromLocalStorage();
  if (localCart && isAuthenticated) {
    await api.post("/cart/sync/", localCart);
  }
};
```

### 2. Cross-Tab Sync

Sử dụng `storage` event để sync giữa các tab:

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === CART_STORAGE_KEY) {
      refreshCart();
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);
```

### 3. Cart Expiration

Thêm thời gian hết hạn cho giỏ hàng:

```typescript
interface Cart {
  items: CartItem[];
  total_items: number;
  total_price: number;
  items_count: number;
  expires_at: number; // timestamp
}
```

### 4. Persistent Undo

Lưu lịch sử thay đổi để có thể undo:

```typescript
const cartHistory: Cart[] = [];
const undo = () => {
  const previousCart = cartHistory.pop();
  if (previousCart) {
    setCart(previousCart);
  }
};
```

## Troubleshooting

### Giỏ hàng không cập nhật

**Nguyên nhân**: localStorage bị disable hoặc đầy

**Giải pháp**:

```typescript
try {
  localStorage.setItem("test", "test");
  localStorage.removeItem("test");
} catch (e) {
  alert("LocalStorage không khả dụng");
}
```

### Dữ liệu bị mất sau khi reload

**Nguyên nhân**: Chưa gọi `loadCartFromLocalStorage()` trong useEffect

**Giải pháp**: Đảm bảo `useEffect` chạy khi component mount

### Badge không cập nhật

**Nguyên nhân**: Topbar không re-render

**Giải pháp**: Đảm bảo `useCart()` được gọi trong Topbar component

### Console errors về JSON parse

**Nguyên nhân**: Dữ liệu localStorage bị corrupt

**Giải pháp**:

```typescript
try {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (savedCart) {
    const cart = JSON.parse(savedCart);
  }
} catch (error) {
  // Clear corrupt data
  localStorage.removeItem(CART_STORAGE_KEY);
}
```

## Kết Luận

Giỏ hàng localStorage là giải pháp đơn giản, nhanh chóng và hiệu quả cho các ứng dụng không cần đồng bộ dữ liệu giữa các thiết bị. Phù hợp cho:

- Demo/prototype
- Ứng dụng offline-first
- Single-device shopping
- Không có yêu cầu bảo mật cao

---

**Version**: 1.0.0  
**Ngày tạo**: 12/11/2025  
**Tác giả**: GitHub Copilot
