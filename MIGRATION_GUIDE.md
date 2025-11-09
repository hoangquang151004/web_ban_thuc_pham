# Hướng dẫn Migration và Setup

## 1. Chạy migrations cho role seller mới

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 2. Khởi động backend server

```bash
python manage.py runserver
```

## 3. Khởi động frontend (terminal mới)

```bash
cd frontend
npm run dev
```

## 4. Test các chức năng

### Test Quản lý tài khoản (Admin only):

1. Đăng nhập với tài khoản admin
2. Vào trang: http://localhost:3000/admin/accounts
3. Test các chức năng:
   - ✅ Xem danh sách tất cả tài khoản
   - ✅ Thêm tài khoản mới (admin/seller/customer)
   - ✅ Chỉnh sửa thông tin tài khoản
   - ✅ Xóa tài khoản
   - ✅ Bật/tắt trạng thái tài khoản
   - ✅ Tìm kiếm tài khoản

### Test role Seller:

1. Tạo tài khoản seller từ trang quản lý tài khoản
2. Đăng nhập với seller account
3. Kiểm tra menu - seller có tất cả chức năng EXCEPT "Quản Lý Tài Khoản"
4. Seller có thể:
   - ✅ Quản lý danh mục
   - ✅ Quản lý sản phẩm
   - ✅ Quản lý đơn hàng
   - ✅ Quản lý đánh giá
   - ✅ Xem thống kê báo cáo

### Test role permissions:

1. **Admin**: Full access to all features
2. **Seller**: Access to all except account management
3. **Customer**: Only customer features (products, cart, orders, reviews)

## 5. Tạo tài khoản test

### Tạo admin qua Django admin:

```bash
python manage.py createsuperuser
```

### Tạo seller và customer qua API hoặc Admin panel:

- Truy cập: http://localhost:3000/admin/accounts (với tài khoản admin)
- Click "Thêm mới"
- Điền thông tin và chọn role phù hợp

## 6. API Endpoints mới

### Quản lý tài khoản (Admin only):

- `GET /api/auth/users/` - List all users
- `GET /api/auth/users/{id}/` - Get user detail
- `POST /api/auth/users/` - Create new user
- `PATCH /api/auth/users/{id}/` - Update user
- `DELETE /api/auth/users/{id}/` - Delete user
- `POST /api/auth/users/{id}/toggle_status/` - Toggle active status

### Query parameters:

- `?role=admin|seller|customer` - Filter by role
- `?search=keyword` - Search by name/email/phone
- `?page=1&page_size=10` - Pagination

### Example request:

```bash
curl -X GET "http://localhost:8000/api/auth/users/?role=seller" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 7. Database Changes

### New role added:

```python
ROLE_CHOICES = [
    ('customer', 'Khách hàng'),
    ('seller', 'Người bán'),      # NEW
    ('admin', 'Quản trị viên'),
]
```

### Migration creates:

- Updated User.role field with new choice
- No data migration needed (existing users keep their roles)

## 8. Frontend Changes

### Files updated:

1. `types/layout.d.ts` - Added 'seller' to role type
2. `layout/context/layoutcontext.tsx` - Support seller role
3. `layout/AppMenu.tsx` - Separate menus for admin/seller/customer
4. `layout/AppTopbar.tsx` - Display seller badge
5. `services/api.ts` - Added userManagementAPI
6. `app/(main)/admin/accounts/page.tsx` - Full CRUD with API

### Role-based menu:

- **Admin menu**: All 6 features including account management
- **Seller menu**: 5 features (no account management)
- **Customer menu**: In topbar (products, cart, orders, reviews)

## 9. Security Notes

### Backend permissions:

- `IsAdminUser` - Custom permission for admin-only endpoints
- User management endpoints require admin role
- Users cannot delete/deactivate themselves
- Password is required only for new accounts (not for updates)

### Frontend validation:

- Email format validation
- Phone format validation (10 digits)
- Password confirmation match
- Required fields check
- Loading states prevent double-submission

## 10. Troubleshooting

### Migration errors:

```bash
# If migration fails, reset migrations:
python manage.py migrate users zero
python manage.py makemigrations users
python manage.py migrate users
```

### API returns 401 Unauthorized:

- Check if user is logged in
- Check if user has admin role
- Check if token is valid and not expired

### Role not displaying correctly:

- Clear browser localStorage
- Re-login to get fresh token with correct role

## 11. Next Steps

Sau khi test xong, có thể mở rộng:

- [ ] Permission-based access cho từng chức năng chi tiết
- [ ] Audit log cho thao tác quản lý tài khoản
- [ ] Bulk actions (delete/activate multiple users)
- [ ] Export user list to Excel
- [ ] Advanced filters (created date range, etc.)
- [ ] User activity tracking
