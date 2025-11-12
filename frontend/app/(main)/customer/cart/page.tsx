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
                <div className="card">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">Giỏ Hàng Của Bạn</h5>
                        <div className="flex gap-2">
                            <Link href="/customer/products">
                                <Button label="Tiếp tục mua sắm" icon="pi pi-arrow-left" outlined />
                            </Link>
                            {cartItems.length > 0 && <Button label="Xóa tất cả" icon="pi pi-trash" severity="danger" outlined onClick={handleClearCart} disabled={loading} />}
                        </div>
                    </div>

                    {loading && cartItems.length === 0 ? (
                        <div className="text-center py-8">
                            <ProgressSpinner />
                        </div>
                    ) : cartItems.length === 0 ? (
                        <div className="text-center py-8">
                            <i className="pi pi-shopping-cart text-6xl text-400 mb-4"></i>
                            <h3 className="text-600">Giỏ hàng của bạn đang trống</h3>
                            <p className="text-500 mb-4">Hãy thêm một số sản phẩm vào giỏ hàng của bạn!</p>
                            <Link href="/customer/products">
                                <Button label="Mua sắm ngay" icon="pi pi-shopping-bag" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <DataTable value={cartItems} responsiveLayout="scroll">
                                <Column header="Sản phẩm" body={imageBodyTemplate} style={{ width: '100px' }} />
                                <Column header="Tên sản phẩm" body={nameBodyTemplate} style={{ minWidth: '200px' }} />
                                <Column header="Giá" body={priceBodyTemplate} style={{ minWidth: '150px' }} />
                                <Column header="Số lượng" body={quantityBodyTemplate} style={{ minWidth: '180px' }} />
                                <Column header="Tổng" body={totalPriceBodyTemplate} style={{ minWidth: '150px' }} />
                                <Column body={actionBodyTemplate} exportable={false} style={{ width: '100px' }} />
                            </DataTable>

                            <div className="grid mt-4">
                                <div className="col-12 md:col-4">
                                    <div className="surface-100 p-4 border-round">
                                        <h6 className="mt-0">Tổng đơn hàng</h6>
                                        <div className="flex justify-content-between mb-2">
                                            <span>Tạm tính:</span>
                                            <span className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateSubtotal())}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-2">
                                            <span>Phí vận chuyển:</span>
                                            <span className={calculateShipping() === 0 ? 'text-green-500 font-bold' : ''}>
                                                {calculateShipping() === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateShipping())}
                                            </span>
                                        </div>
                                        <div className="border-top-1 surface-border pt-2 mb-3"></div>
                                        <div className="flex justify-content-between mb-3">
                                            <span className="font-bold text-xl">Tổng cộng:</span>
                                            <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}</span>
                                        </div>
                                        {calculateSubtotal() < 500000 && (
                                            <p className="text-xs text-500 mb-3">Mua thêm {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(500000 - calculateSubtotal())} để được miễn phí vận chuyển!</p>
                                        )}
                                        <Link href="/customer/checkout">
                                            <Button label="Thanh toán" icon="pi pi-credit-card" className="w-full" size="large" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartPage;
