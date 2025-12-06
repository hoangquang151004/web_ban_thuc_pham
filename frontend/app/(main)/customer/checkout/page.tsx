'use client';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/layout/context/cartcontext';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const CheckoutPage = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { cart, clearCart, loading: cartLoading } = useCart();

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        district: '',
        note: ''
    });

    const [paymentMethod, setPaymentMethod] = useState<string>('cod');
    const [submitting, setSubmitting] = useState(false);
    const [loadingUserInfo, setLoadingUserInfo] = useState(true);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const cartItems = cart?.items || [];

    // Load user information from localStorage
    useEffect(() => {
        const loadUserInfo = () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    setFormData((prev) => ({
                        ...prev,
                        fullName: user.full_name || '',
                        phone: user.phone || '',
                        email: user.email || '',
                        address: user.address || ''
                    }));
                }
            } catch (error) {
                console.error('Error loading user info:', error);
            } finally {
                setLoadingUserInfo(false);
            }
        };

        loadUserInfo();
    }, []);

    // Kiểm tra giỏ hàng rỗng (chỉ khi không phải sau khi đặt hàng thành công)
    useEffect(() => {
        if (!cartLoading && cartItems.length === 0 && !orderSuccess) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Giỏ hàng trống',
                detail: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán',
                life: 3000
            });
            setTimeout(() => {
                router.push('/customer/products');
            }, 1500);
        }
    }, [cartLoading, cartItems.length, orderSuccess, router]);

    const calculateSubtotal = () => {
        return cart?.total_price || 0;
    };

    const calculateShipping = () => {
        const subtotal = calculateSubtotal();
        return subtotal >= 500000 ? 0 : 30000;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping();
    };

    const handleSubmit = async () => {
        // Validate form
        if (!formData.fullName || !formData.phone || !formData.address) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Thiếu thông tin',
                detail: 'Vui lòng điền đầy đủ thông tin giao hàng',
                life: 3000
            });
            return;
        }

        // Validate phone number
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(formData.phone)) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Số điện thoại không hợp lệ',
                detail: 'Vui lòng nhập số điện thoại hợp lệ (10-11 số)',
                life: 3000
            });
            return;
        }

        // Validate email nếu có
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Email không hợp lệ',
                    detail: 'Vui lòng nhập email hợp lệ',
                    life: 3000
                });
                return;
            }
        }

        setSubmitting(true);

        try {
            // Chuẩn bị dữ liệu đơn hàng
            const orderData = {
                full_name: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                district: formData.district,
                city: formData.city,
                note: formData.note,
                payment_method: paymentMethod,
                items: cartItems.map((item) => ({
                    product_id: item.product.id,
                    quantity: item.quantity
                }))
            };

            // Gọi API tạo đơn hàng
            const token = localStorage.getItem('access_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            // Thêm token nếu user đã đăng nhập
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/orders/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(orderData)
            });

            // Kiểm tra content type trước khi parse JSON
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Nếu không phải JSON, có thể là HTML error page
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Lỗi kết nối API (Status: ${response.status}). Vui lòng kiểm tra backend đang chạy tại ${API_BASE_URL}`);
            }

            if (!response.ok) {
                // Xử lý lỗi từ backend
                let errorMessage = 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.';

                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data.error) {
                    errorMessage = data.error;
                } else if (data.items) {
                    errorMessage = Array.isArray(data.items) ? data.items[0] : data.items;
                } else if (data.non_field_errors) {
                    errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
                } else if (data.detail) {
                    errorMessage = data.detail;
                }

                throw new Error(errorMessage);
            }

            if (data && data.order) {
                // Đánh dấu đặt hàng thành công để tránh redirect về trang products
                setOrderSuccess(true);

                // Kiểm tra nếu là thanh toán VNPay
                if (paymentMethod === 'vnpay') {
                    // Gọi API tạo URL thanh toán VNPay
                    const vnpayResponse = await fetch(`${API_BASE_URL}/api/orders/${data.order.id}/create_vnpay_payment/`, {
                        method: 'POST',
                        headers
                    });

                    if (vnpayResponse.ok) {
                        const vnpayData = await vnpayResponse.json();

                        toast.current?.show({
                            severity: 'info',
                            summary: 'Chuyển đến trang thanh toán',
                            detail: 'Đang chuyển hướng đến VNPay...',
                            life: 2000
                        });

                        // Xóa giỏ hàng trước khi chuyển đến VNPay
                        await clearCart();

                        // Chuyển hướng đến trang thanh toán VNPay
                        setTimeout(() => {
                            window.location.href = vnpayData.payment_url;
                        }, 1000);
                        return;
                    } else {
                        throw new Error('Không thể tạo URL thanh toán VNPay');
                    }
                }

                // Kiểm tra nếu là thanh toán MoMo
                if (paymentMethod === 'momo') {
                    // Gọi API tạo payment request tới MoMo
                    const momoResponse = await fetch(`${API_BASE_URL}/api/orders/${data.order.id}/create_momo_payment/`, {
                        method: 'POST',
                        headers
                    });

                    if (momoResponse.ok) {
                        const momoData = await momoResponse.json();

                        toast.current?.show({
                            severity: 'info',
                            summary: 'Chuyển đến trang thanh toán',
                            detail: 'Đang chuyển hướng đến MoMo...',
                            life: 2000
                        });

                        // Xóa giỏ hàng trước khi chuyển đến MoMo
                        await clearCart();

                        // Chuyển hướng đến trang thanh toán MoMo
                        setTimeout(() => {
                            window.location.href = momoData.payment_url;
                        }, 1000);
                        return;
                    } else {
                        const momoError = await momoResponse.json();
                        throw new Error(momoError.error || 'Không thể tạo payment request MoMo');
                    }
                }

                // Chuyển hướng ngay lập tức đến trang đơn hàng
                router.push('/customer/orders');

                // Xóa giỏ hàng sau khi đã bắt đầu chuyển hướng
                await clearCart();
            }
        } catch (error: any) {
            console.error('Error creating order:', error);

            toast.current?.show({
                severity: 'error',
                summary: 'Đặt hàng thất bại',
                detail: error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.',
                life: 5000
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (cartLoading || loadingUserInfo) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="text-center py-8">
                            <ProgressSpinner />
                            <p className="mt-4">Đang tải thông tin...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Empty cart
    if (cartItems.length === 0) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="text-center py-8">
                            <i className="pi pi-shopping-cart text-6xl text-400 mb-4"></i>
                            <h3 className="text-600">Giỏ hàng của bạn đang trống</h3>
                            <p className="text-500 mb-4">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán</p>
                            <Link href="/customer/products">
                                <Button label="Mua sắm ngay" icon="pi pi-shopping-bag" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                <div className="card">
                    <h5>Thanh Toán</h5>
                </div>
            </div>

            <div className="col-12 md:col-8">
                <div className="card">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h6 className="m-0">Thông tin giao hàng</h6>
                        {formData.fullName && (
                            <small className="text-500">
                                <i className="pi pi-info-circle mr-1"></i>
                                Thông tin được lấy từ tài khoản của bạn
                            </small>
                        )}
                    </div>
                    <div className="grid p-fluid">
                        <div className="col-12">
                            <label htmlFor="fullName">Họ và tên *</label>
                            <InputText id="fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Nhập họ và tên người nhận" />
                        </div>
                        <div className="col-12 md:col-6">
                            <label htmlFor="phone">Số điện thoại *</label>
                            <InputText id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Nhập số điện thoại" />
                        </div>
                        <div className="col-12 md:col-6">
                            <label htmlFor="email">Email</label>
                            <InputText id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Nhập email (không bắt buộc)" />
                        </div>
                        <div className="col-12">
                            <label htmlFor="address">Địa chỉ *</label>
                            <InputText id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Nhập địa chỉ chi tiết (số nhà, đường...)" />
                        </div>
                        <div className="col-12 md:col-6">
                            <label htmlFor="district">Quận/Huyện</label>
                            <InputText id="district" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} placeholder="Nhập quận/huyện" />
                        </div>
                        <div className="col-12 md:col-6">
                            <label htmlFor="city">Tỉnh/Thành phố</label>
                            <InputText id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Nhập tỉnh/thành phố" />
                        </div>
                        <div className="col-12">
                            <label htmlFor="note">Ghi chú</label>
                            <InputTextarea id="note" rows={3} value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Ghi chú về đơn hàng (giao giờ hành chính, gọi trước khi giao...)" />
                        </div>
                    </div>

                    {!formData.fullName && (
                        <div className="surface-100 p-3 border-round mt-3">
                            <div className="flex align-items-start">
                                <i className="pi pi-info-circle text-blue-500 mr-2 mt-1"></i>
                                <div className="flex-1">
                                    <p className="m-0 text-sm">
                                        <strong>Mẹo:</strong> Đăng nhập để tự động điền thông tin giao hàng từ tài khoản của bạn.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <Divider />

                    <h6>Phương thức thanh toán</h6>
                    <div className="flex flex-column gap-3">
                        <div className="flex align-items-center">
                            <RadioButton inputId="cod" name="payment" value="cod" onChange={(e) => setPaymentMethod(e.value)} checked={paymentMethod === 'cod'} />
                            <label htmlFor="cod" className="ml-2">
                                <i className="pi pi-money-bill mr-2"></i>
                                Thanh toán khi nhận hàng (COD)
                            </label>
                        </div>
                        <div className="flex align-items-center">
                            <RadioButton inputId="vnpay" name="payment" value="vnpay" onChange={(e) => setPaymentMethod(e.value)} checked={paymentMethod === 'vnpay'} />
                            <label htmlFor="vnpay" className="ml-2">
                                <i className="pi pi-credit-card mr-2"></i>
                                Thanh toán qua VNPay
                            </label>
                        </div>
                        <div className="flex align-items-center">
                            <RadioButton inputId="momo" name="payment" value="momo" onChange={(e) => setPaymentMethod(e.value)} checked={paymentMethod === 'momo'} />
                            <label htmlFor="momo" className="ml-2">
                                <i className="pi pi-wallet mr-2"></i>
                                Thanh toán qua Momo
                            </label>
                        </div>
                        <div className="flex align-items-center">
                            <RadioButton inputId="banking" name="payment" value="banking" onChange={(e) => setPaymentMethod(e.value)} checked={paymentMethod === 'banking'} />
                            <label htmlFor="banking" className="ml-2">
                                <i className="pi pi-building mr-2"></i>
                                Chuyển khoản ngân hàng
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12 md:col-4">
                <div className="card">
                    <h6>Đơn hàng của bạn</h6>
                    {cartItems.map((item) => {
                        const imageUrl = item.product.main_image_url || item.product.main_image || '/demo/images/product/placeholder.png';
                        return (
                            <div key={item.id} className="flex align-items-center mb-3 pb-3 border-bottom-1 surface-border">
                                <div style={{ position: 'relative', width: '4rem', height: '4rem', marginRight: '0.75rem' }}>
                                    <Image src={imageUrl} alt={item.product.name} fill style={{ objectFit: 'cover', borderRadius: '6px' }} sizes="64px" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-900 mb-1">{item.product.name}</div>
                                    <div className="text-600 text-sm">Số lượng: {item.quantity}</div>
                                </div>
                                <div className="text-900 font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.subtotal)}</div>
                            </div>
                        );
                    })}

                    <Divider />

                    <div className="flex justify-content-between mb-2">
                        <span>Tạm tính:</span>
                        <span className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-content-between mb-3">
                        <span>Phí vận chuyển:</span>
                        <span className={calculateShipping() === 0 ? 'text-green-500 font-bold' : ''}>{calculateShipping() === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateShipping())}</span>
                    </div>

                    <Divider />

                    <div className="flex justify-content-between mb-4">
                        <span className="font-bold text-xl">Tổng cộng:</span>
                        <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}</span>
                    </div>

                    <Button
                        label={submitting ? 'Đang xử lý...' : 'Đặt hàng'}
                        icon={submitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                        className="w-full"
                        size="large"
                        onClick={handleSubmit}
                        disabled={submitting || cartItems.length === 0}
                        loading={submitting}
                    />
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
