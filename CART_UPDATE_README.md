# Cập Nhật Chức Năng Giỏ Hàng - LocalStorage

## 📋 Tóm Tắt

Đã hoàn thiện chức năng giỏ hàng sử dụng **localStorage** (session storage), không cần kết nối backend. Tất cả dữ liệu giỏ hàng được lưu trữ trên trình duyệt của người dùng.

## 🚀 Các File Đã Cập Nhật

### 1. CartContext (`layout/context/cartcontext.tsx`)

**Thay đổi chính:**

- ❌ Loại bỏ API calls đến backend
- ✅ Sử dụng localStorage để lưu trữ giỏ hàng
- ✅ Tự động load giỏ hàng khi component mount
- ✅ Tự động tính toán tổng tiền, số lượng
- ✅ Kiểm tra tồn kho trước khi thêm/cập nhật
- ✅ Xử lý lỗi chi tiết

**Các function:**

```typescript
- addToCart(product, quantity): Thêm sản phẩm vào giỏ
- updateCartItem(productId, quantity): Cập nhật số lượng
- removeFromCart(productId): Xóa sản phẩm
- clearCart(): Xóa toàn bộ giỏ hàng
- getCartCount(): Lấy tổng số items
- refreshCart(): Làm mới từ localStorage
```

### 2. Trang Products (`app/(main)/customer/products/page.tsx`)

**Thay đổi chính:**

- ✅ Tích hợp `useCart` hook
- ✅ Xóa local state quản lý giỏ hàng
- ✅ Sử dụng `addToCart` từ context
- ✅ Hiển thị tổng số items từ `getCartCount()`
- ✅ Toast notification khi thêm thành công/thất bại

### 3. Trang Cart (`app/(main)/customer/cart/page.tsx`)

**Thay đổi chính:**

- ✅ Cập nhật hiển thị image (sử dụng main_image_url)
- ✅ Sửa category display (sử dụng category_name)
- ✅ Hoạt động hoàn toàn với localStorage

## 📦 Cấu Trúc Dữ Liệu

### LocalStorage Key

```
shopping_cart
```

### Cấu Trúc JSON

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
        "old_price": 280000,
        "main_image": "/media/products/...",
        "main_image_url": "http://localhost:8000/media/...",
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

## 🎯 Các Tính Năng

### ✅ Đã Hoàn Thành

1. **Thêm sản phẩm vào giỏ**

   - Kiểm tra tồn kho
   - Tự động tăng số lượng nếu sản phẩm đã có
   - Toast notification

2. **Cập nhật số lượng**

   - Kiểm tra tồn kho
   - Tự động xóa nếu số lượng = 0
   - Toast notification

3. **Xóa sản phẩm**

   - Confirm dialog
   - Toast notification

4. **Xóa tất cả**

   - Confirm dialog
   - Toast notification

5. **Hiển thị trên Topbar**

   - Badge với số lượng items
   - Link đến trang giỏ hàng

6. **Tính toán tự động**

   - Tổng số items
   - Tổng giá trị
   - Phí vận chuyển (miễn phí nếu ≥ 500k)

7. **Lưu trữ vĩnh viễn**
   - Tự động lưu vào localStorage
   - Tự động load khi reload trang

## 🧪 Hướng Dẫn Test

### Test 1: Thêm Sản Phẩm

```
1. Vào /customer/products
2. Click icon giỏ hàng trên sản phẩm
3. Kiểm tra:
   ✓ Toast "Đã thêm vào giỏ" xuất hiện
   ✓ Badge trên topbar tăng
   ✓ F12 > Application > Local Storage > shopping_cart có dữ liệu
```

### Test 2: Xem Giỏ Hàng

```
1. Click "Giỏ Hàng" trên topbar
2. Kiểm tra:
   ✓ Sản phẩm hiển thị đúng
   ✓ Giá, số lượng chính xác
   ✓ Tổng tiền đúng
```

### Test 3: Cập Nhật Số Lượng

```
1. Trong trang giỏ hàng
2. Click + hoặc - để thay đổi số lượng
3. Kiểm tra:
   ✓ Số lượng thay đổi
   ✓ Tổng tiền cập nhật
   ✓ Toast "Đã cập nhật"
```

### Test 4: Xóa Sản Phẩm

```
1. Click icon thùng rác
2. Confirm "Có"
3. Kiểm tra:
   ✓ Sản phẩm biến mất
   ✓ Tổng tiền giảm
   ✓ Badge giảm
```

### Test 5: Xóa Tất Cả

```
1. Click "Xóa tất cả"
2. Confirm "Có"
3. Kiểm tra:
   ✓ Giỏ hàng trống
   ✓ Badge = 0
   ✓ Hiển thị "Giỏ hàng trống"
```

### Test 6: Kiểm Tra Tồn Kho

```
1. Thêm sản phẩm với số lượng = stock
2. Thử thêm lại
3. Kiểm tra:
   ✓ Toast lỗi "Chỉ còn X trong kho"
   ✓ Số lượng không tăng
```

### Test 7: Reload Trang

```
1. Thêm vài sản phẩm vào giỏ
2. Reload trang (F5)
3. Kiểm tra:
   ✓ Giỏ hàng vẫn còn
   ✓ Badge hiển thị đúng
   ✓ Tổng tiền đúng
```

## 🔧 Cách Sử Dụng

### Trong Component

```typescript
import { useCart } from "@/layout/context/cartcontext";

function MyComponent() {
  const { cart, addToCart, getCartCount } = useCart();

  const handleAdd = async (product) => {
    try {
      await addToCart(product, 1);
      toast.show({ severity: "success", summary: "Thành công" });
    } catch (error) {
      toast.show({ severity: "error", summary: "Lỗi" });
    }
  };

  return (
    <div>
      <p>Giỏ hàng: {getCartCount()} items</p>
      <Button onClick={() => handleAdd(product)}>Thêm vào giỏ</Button>
    </div>
  );
}
```

## 📝 Notes

### Ưu Điểm

- ✅ Không cần backend
- ✅ Nhanh, không có network latency
- ✅ Hoạt động offline
- ✅ Đơn giản, dễ maintain

### Hạn Chế

- ⚠️ Không đồng bộ giữa devices
- ⚠️ Giới hạn dung lượng (~5-10MB)
- ⚠️ Mất dữ liệu khi clear cache
- ⚠️ Có thể bị sửa đổi bởi user

### Nâng Cấp Tương Lai

- [ ] Sync với backend khi user login
- [ ] Cross-tab synchronization
- [ ] Cart expiration
- [ ] Undo/Redo functionality

## 📚 Tài Liệu

Chi tiết xem file: `CART_LOCALSTORAGE_GUIDE.md`

## 🐛 Troubleshooting

### Giỏ hàng không lưu

- Kiểm tra localStorage có enabled không
- Kiểm tra dung lượng storage

### Badge không cập nhật

- Đảm bảo Topbar sử dụng useCart hook
- Check console có lỗi không

### Dữ liệu bị mất sau reload

- Kiểm tra useEffect trong CartProvider
- Kiểm tra localStorage key

## ✅ Checklist

- [x] CartContext hoàn thiện
- [x] Products page tích hợp
- [x] Cart page tích hợp
- [x] Topbar hiển thị badge
- [x] Toast notifications
- [x] Error handling
- [x] Stock validation
- [x] Tài liệu đầy đủ

---

**Hoàn thành**: 12/11/2025
**Developer**: GitHub Copilot
**Status**: ✅ Ready for Testing
