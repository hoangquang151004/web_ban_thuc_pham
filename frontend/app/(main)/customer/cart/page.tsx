/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import React, { useRef } from 'react';
import Link from 'next/link';
import { useCart, CartItem } from '@/layout/context/cartcontext';
import { ProgressSpinner } from 'primereact/progressspinner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const CartPage = () => {
    const { cart, loading, updateCartItem, removeFromCart, clearCart: clearCartContext } = useCart();
    const toast = useRef<Toast>(null);

    const cartItems = cart?.items || [];

    const updateQuantity = async (productId: number, newQuantity: number) => {
        if (newQuantity === 0) {
            confirmRemove(productId);
            return;
        }

        try {
            await updateCartItem(productId, newQuantity);
            toast.current?.show({
                severity: 'success',
                summary: 'Đã cập nhật',
                detail: 'Số lượng sản phẩm đã được cập nhật',
                life: 2000
            });
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.response?.data?.error || error.response?.data?.quantity || 'Không thể cập nhật số lượng',
                life: 3000
            });
        }
    };

    const confirmRemove = (productId: number) => {
        const item = cartItems.find((i) => i.product.id === productId);
        confirmDialog({
            message: `Bạn có chắc chắn muốn xóa "${item?.product.name}" khỏi giỏ hàng?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: () => removeItem(productId),
            reject: () => {},
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const removeItem = async (productId: number) => {
        try {
            await removeFromCart(productId);
            toast.current?.show({
                severity: 'success',
                summary: 'Đã xóa',
                detail: 'Sản phẩm đã được xóa khỏi giỏ hàng',
                life: 3000
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể xóa sản phẩm',
                life: 3000
            });
        }
    };

    const handleClearCart = () => {
        confirmDialog({
            message: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?',
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await clearCartContext();
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Đã xóa',
                        detail: 'Giỏ hàng đã được làm trống',
                        life: 3000
                    });
                } catch (error) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể xóa giỏ hàng',
                        life: 3000
                    });
                }
            },
            reject: () => {},
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const imageBodyTemplate = (rowData: CartItem) => {
        const imageUrl = rowData.product.main_image_url || rowData.product.main_image || '/demo/images/product/placeholder.png';
        return <img src={imageUrl} alt={rowData.product.name} className="shadow-2 border-round" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />;
    };

    const nameBodyTemplate = (rowData: CartItem) => {
        return (
            <div>
                <div className="font-semibold">{rowData.product.name}</div>
                <div className="text-sm text-500">{rowData.product.category_name}</div>
            </div>
        );
    };

    const priceBodyTemplate = (rowData: CartItem) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.price);
    };

    const quantityBodyTemplate = (rowData: CartItem) => {
        return (
            <InputNumber
                value={rowData.quantity}
                onValueChange={(e) => updateQuantity(rowData.product.id, e.value || 0)}
                showButtons
                min={0}
                max={rowData.product.stock}
                buttonLayout="horizontal"
                decrementButtonClassName="p-button-danger"
                incrementButtonClassName="p-button-success"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
                disabled={loading}
            />
        );
    };

    const totalPriceBodyTemplate = (rowData: CartItem) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.subtotal);
    };

    const actionBodyTemplate = (rowData: CartItem) => {
        return <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmRemove(rowData.product.id)} disabled={loading} />;
    };

    const calculateSubtotal = () => {
        return cart?.total_price || 0;
    };

    const calculateShipping = () => {
        const subtotal = calculateSubtotal();
        return subtotal >= 500000 ? 0 : 30000; // Free shipping for orders over 500k
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping();
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="col-12">
                <div className="card shadow-3">
                    <div className="flex flex-column md:flex-row justify-content-between align-items-center mb-5 gap-3">
                        <div className="flex align-items-center gap-3">
                            <i className="pi pi-shopping-cart text-4xl text-primary"></i>
                            <div>
                                <h3 className="m-0 mb-1">Giỏ Hàng Của Bạn</h3>
                                <p className="m-0 text-600 text-sm">{cartItems.length} sản phẩm</p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Link href="/customer/products">
                                <Button label="Tiếp tục mua sắm" icon="pi pi-arrow-left" outlined className="white-space-nowrap" />
                            </Link>
                            {cartItems.length > 0 && <Button label="Xóa tất cả" icon="pi pi-trash" severity="danger" outlined onClick={handleClearCart} disabled={loading} className="white-space-nowrap" />}
                        </div>
                    </div>

                    {loading && cartItems.length === 0 ? (
                        <div className="text-center py-8">
                            <ProgressSpinner />
                        </div>
                    ) : cartItems.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="inline-flex align-items-center justify-content-center bg-primary-50 border-circle mb-4" style={{ width: '120px', height: '120px' }}>
                                <i className="pi pi-shopping-cart text-6xl text-primary"></i>
                            </div>
                            <h3 className="text-900 mb-2">Giỏ hàng của bạn đang trống</h3>
                            <p className="text-600 mb-4 text-lg">Hãy thêm một số sản phẩm vào giỏ hàng của bạn!</p>
                            <Link href="/customer/products">
                                <Button label="Mua sắm ngay" icon="pi pi-shopping-bag" size="large" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <DataTable value={cartItems} responsiveLayout="scroll" className="cart-table" stripedRows>
                                    <Column header="Sản phẩm" body={imageBodyTemplate} style={{ width: '100px' }} />
                                    <Column header="Tên sản phẩm" body={nameBodyTemplate} style={{ minWidth: '200px' }} />
                                    <Column header="Giá" body={priceBodyTemplate} style={{ minWidth: '150px' }} />
                                    <Column header="Số lượng" body={quantityBodyTemplate} style={{ minWidth: '180px' }} />
                                    <Column header="Tổng" body={totalPriceBodyTemplate} style={{ minWidth: '150px' }} />
                                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '100px' }} />
                                </DataTable>
                            </div>

                            <div className="grid mt-5">
                                <div className="col-12 lg:col-8">
                                    <div className="surface-50 p-4 border-round border-1 border-primary-200">
                                        <div className="flex align-items-center gap-3 mb-2">
                                            <i className="pi pi-info-circle text-primary text-xl"></i>
                                            <div>
                                                <p className="m-0 font-semibold text-900">Miễn phí vận chuyển</p>
                                                <p className="m-0 text-600 text-sm mt-1">Cho đơn hàng từ 500.000₫</p>
                                            </div>
                                        </div>
                                        {calculateSubtotal() < 500000 && (
                                            <div className="mt-3">
                                                <div className="bg-primary-100 border-round p-2">
                                                    <div className="flex justify-content-between mb-2">
                                                        <span className="text-sm text-primary">Tiến trình miễn phí ship</span>
                                                        <span className="text-sm font-semibold text-primary">{Math.round((calculateSubtotal() / 500000) * 100)}%</span>
                                                    </div>
                                                    <div className="bg-primary-200 border-round overflow-hidden" style={{ height: '8px' }}>
                                                        <div className="bg-primary h-full transition-all transition-duration-300" style={{ width: `${Math.min((calculateSubtotal() / 500000) * 100, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12 lg:col-4">
                                    <div className="surface-0 p-4 border-round shadow-3 border-1 border-200" style={{ position: 'sticky', top: '100px' }}>
                                        <h5 className="mt-0 mb-3 text-primary">
                                            <i className="pi pi-calculator mr-2"></i>
                                            Tổng đơn hàng
                                        </h5>
                                        <div className="flex justify-content-between mb-3 p-2 surface-50 border-round">
                                            <span className="text-700">Tạm tính:</span>
                                            <span className="font-semibold text-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateSubtotal())}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-3 p-2 surface-50 border-round">
                                            <span className="text-700">Phí vận chuyển:</span>
                                            <span className={calculateShipping() === 0 ? 'text-green-600 font-bold' : 'text-900'}>
                                                {calculateShipping() === 0 ? (
                                                    <>
                                                        <i className="pi pi-check-circle mr-1"></i>
                                                        Miễn phí
                                                    </>
                                                ) : (
                                                    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateShipping())
                                                )}
                                            </span>
                                        </div>
                                        <div className="border-top-2 border-primary-200 pt-3 mb-3"></div>
                                        <div className="flex justify-content-between mb-4 p-3 bg-primary-50 border-round">
                                            <span className="font-bold text-xl text-900">Tổng cộng:</span>
                                            <span className="font-bold text-2xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}</span>
                                        </div>
                                        {calculateSubtotal() < 500000 && (
                                            <div className="bg-orange-50 border-round p-3 mb-3 border-1 border-orange-200">
                                                <p className="text-sm text-orange-900 m-0 line-height-3">
                                                    <i className="pi pi-gift mr-2"></i>
                                                    Mua thêm <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(500000 - calculateSubtotal())}</strong> để được miễn phí vận chuyển!
                                                </p>
                                            </div>
                                        )}
                                        <Link href="/customer/checkout">
                                            <Button label="Tiến hành thanh toán" icon="pi pi-arrow-right" iconPos="right" className="w-full" size="large" severity="success" />
                                        </Link>
                                        <div className="text-center mt-3">
                                            <p className="text-xs text-500 m-0">
                                                <i className="pi pi-shield mr-1"></i>
                                                Thanh toán an toàn & bảo mật
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .cart-table .p-datatable-tbody > tr {
                    transition: all 0.2s ease;
                }
                .cart-table .p-datatable-tbody > tr:hover {
                    background: var(--surface-50) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .cart-table img {
                    transition: transform 0.2s ease;
                }
                .cart-table img:hover {
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
};

export default CartPage;
