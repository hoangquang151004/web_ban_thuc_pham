# Hướng Dẫn Chức Năng Xem Chi Tiết Sản Phẩm

## Tổng Quan

Chức năng xem chi tiết sản phẩm đã được hoàn thiện với đầy đủ tính năng:

- ✅ Hiển thị thông tin chi tiết sản phẩm từ API backend
- ✅ Gallery hình ảnh với Galleria component
- ✅ Thông tin giá, khuyến mãi, tồn kho
- ✅ Thông số kỹ thuật
- ✅ Mô tả chi tiết
- ✅ Đánh giá sản phẩm
- ✅ Sản phẩm liên quan
- ✅ Thêm vào giỏ hàng
- ✅ Loading skeleton
- ✅ Xử lý lỗi

## Cấu Trúc Files

### Frontend

- `frontend/app/(main)/customer/products/[id]/page.tsx` - Trang chi tiết sản phẩm
- `frontend/services/api.ts` - API service với `productAPI.getByIdOrSlug()`

### Backend

- `backend/products/models.py` - Model Product với các fields đầy đủ
- `backend/products/views.py` - ViewSet với `retrieve()` method hỗ trợ slug/id
- `backend/products/serializers.py` - ProductSerializer đầy đủ thông tin

## Các Tính Năng Chính

### 1. Hiển Thị Thông Tin Sản Phẩm

```typescript
// Dữ liệu từ API
interface Product {
    id: number;
    name: string;
    slug: string;
    category_name: string;
    price: number;
    old_price: number | null;
    discount_percentage: number;
    stock: number;
    unit: string;
    rating: number;
    reviews_count: number;
    sold_count: number;
    description: string;
    detail_description: string;
    main_image_url: string;
    product_images: Array<{...}>;
    specifications_dict: {...};
    origin: string;
    weight: string;
    preservation: string;
    expiry: string;
    certification: string;
    in_stock: boolean;
}
```

### 2. Gallery Hình Ảnh

- Hiển thị ảnh chính và ảnh phụ
- Thumbnail navigation
- Full-screen view
- Xử lý trường hợp không có ảnh

### 3. Thông Tin Giá

- Giá hiện tại
- Giá cũ (nếu có khuyến mãi)
- Phần trăm giảm giá
- Tình trạng tồn kho

### 4. Thông Số Kỹ Thuật

Hiển thị các thông tin:

- Xuất xứ
- Trọng lượng
- Cách bảo quản
- Hạn sử dụng
- Chứng nhận
- Các thông số tùy chỉnh từ `specifications_dict`

### 5. Sản Phẩm Liên Quan

- Tự động load sản phẩm cùng danh mục
- Hiển thị tối đa 4 sản phẩm
- Click để xem chi tiết

### 6. Thêm Vào Giỏ Hàng

- Chọn số lượng
- Nút "Thêm vào giỏ"
- Nút "Mua ngay" (thêm và chuyển đến giỏ hàng)
- Vô hiệu hóa khi hết hàng

## URL Routing

### Hỗ trợ cả ID và Slug

```
/customer/products/1          // By ID
/customer/products/cai-thao   // By Slug (recommended)
```

### Backend API

```python
GET /api/products/{id_or_slug}/
Response:
{
    "message": "Lấy thông tin sản phẩm thành công",
    "data": {
        // Product data
    }
}
```

## Xử Lý Lỗi

### Loading State

- Hiển thị Skeleton loading khi đang tải dữ liệu
- Skeleton cho gallery, thông tin, v.v.

### Error State

- Hiển thị thông báo lỗi rõ ràng
- Nút quay lại danh sách sản phẩm
- Toast notification cho các lỗi

### Empty State

- Placeholder image khi không có ảnh
- Message khi không có thông số kỹ thuật
- Message khi không có đánh giá

## Cách Sử Dụng

### 1. Đảm Bảo Backend Đang Chạy

```bash
cd backend
python manage.py runserver
```

### 2. Đảm Bảo Frontend Đang Chạy

```bash
cd frontend
npm run dev
```

### 3. Truy Cập Trang Chi Tiết

- Từ danh sách sản phẩm, click nút "Chi tiết"
- Hoặc truy cập trực tiếp: `http://localhost:3000/customer/products/{slug}`

### 4. Test Các Tính Năng

- ✅ Xem gallery ảnh
- ✅ Đọc mô tả và thông số
- ✅ Thay đổi số lượng
- ✅ Thêm vào giỏ hàng
- ✅ Xem sản phẩm liên quan
- ✅ Xem đánh giá

## Tùy Chỉnh

### Thêm Thông Số Kỹ Thuật Mới

```python
# backend/products/models.py
# Thêm field mới hoặc cập nhật specifications JSON
product.specifications = json.dumps({
    "Màu sắc": "Xanh",
    "Kích thước": "500g",
    "Thương hiệu": "ABC",
    # ...
})
```

### Thêm Tab Mới

```tsx
// frontend/app/(main)/customer/products/[id]/page.tsx
<TabView>
  {/* ... existing tabs ... */}
  <TabPanel header="Tab Mới">
    <div>Nội dung tab mới</div>
  </TabPanel>
</TabView>
```

### Custom Styling

```css
/* Thêm vào styles/layout/... */
.product-card {
  /* Custom styles */
}
```

## API Endpoints Liên Quan

### Lấy Chi Tiết Sản Phẩm

```
GET /api/products/{id_or_slug}/
```

### Lấy Sản Phẩm Theo Danh Mục

```
GET /api/products/?category={category_id}&status=active&page_size=8
```

### Upload Ảnh Sản Phẩm (Admin)

```
POST /api/products/{id}/upload_image/
Content-Type: multipart/form-data
Body: { image: File }
```

## Testing Checklist

- [ ] Trang load thành công với slug
- [ ] Trang load thành công với ID
- [ ] Hiển thị đầy đủ thông tin sản phẩm
- [ ] Gallery ảnh hoạt động
- [ ] Tabs chuyển đổi mượt mà
- [ ] Thêm vào giỏ hàng hiển thị toast
- [ ] Sản phẩm liên quan load đúng
- [ ] Loading skeleton hiển thị khi tải
- [ ] Error state hiển thị khi lỗi
- [ ] Responsive trên mobile

## Lưu Ý

1. **Hiệu Suất**: Trang sử dụng lazy loading cho hình ảnh
2. **SEO**: Có thể thêm meta tags cho SEO (Next.js metadata API)
3. **Đánh Giá**: Hiện tại sử dụng mock data, cần tích hợp với backend trong tương lai
4. **Giỏ Hàng**: Hiện lưu trong state, cần tích hợp với localStorage hoặc API
5. **Authentication**: Một số tính năng (đánh giá) cần đăng nhập

## Tính Năng Cần Bổ Sung (Future)

- [ ] Tích hợp hệ thống đánh giá thực
- [ ] Lưu giỏ hàng vào localStorage
- [ ] Chia sẻ sản phẩm lên mạng xã hội
- [ ] So sánh sản phẩm
- [ ] Wishlist/Yêu thích
- [ ] Q&A sản phẩm
- [ ] Video sản phẩm
- [ ] 360° product view
- [ ] Zoom ảnh chi tiết

## Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:

1. Backend server đang chạy tại `http://localhost:8000`
2. Frontend server đang chạy tại `http://localhost:3000`
3. Database có dữ liệu sản phẩm
4. Console browser có lỗi không
5. Network tab có request API thành công không

## Tác Giả

Được phát triển bởi GitHub Copilot
Ngày cập nhật: November 11, 2025
