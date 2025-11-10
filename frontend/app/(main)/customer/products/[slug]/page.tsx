/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Rating } from 'primereact/rating';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton';
import { Galleria } from 'primereact/galleria';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import React, { useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productAPI } from '@/services/api';

interface Product {
    id: number;
    name: string;
    slug: string;
    category: number;
    category_name: string;
    category_detail: {
        id: number;
        name: string;
        description: string;
    };
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
    main_image: string | null;
    main_image_url: string | null;
    product_images: Array<{
        id: number;
        image: string;
        image_url: string;
        is_main: boolean;
        order: number;
    }>;
    images_list: string[];
    specifications_dict: { [key: string]: string };
    origin: string;
    weight: string;
    preservation: string;
    expiry: string;
    certification: string;
    status: string;
    in_stock: boolean;
}

const ProductDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState<number>(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (slug) {
            loadProduct();
        }
    }, [slug]);

    const loadProduct = async () => {
        setLoading(true);
        try {
            const response = await productAPI.getBySlug(slug);

            if (response && response.data) {
                setProduct(response.data);
            } else if (response && response.id) {
                setProduct(response);
            }
        } catch (error: any) {
            console.error('Error loading product:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải thông tin sản phẩm',
                life: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    const addToCart = () => {
        if (product) {
            // TODO: Implement cart functionality
            toast.current?.show({
                severity: 'success',
                summary: 'Đã thêm vào giỏ',
                detail: `Đã thêm ${quantity} ${product.unit} ${product.name} vào giỏ hàng`,
                life: 3000
            });
        }
    };

    const buyNow = () => {
        addToCart();
        // TODO: Navigate to checkout
        setTimeout(() => {
            router.push('/customer/cart');
        }, 500);
    };

    // Get all images for gallery
    const getAllImages = () => {
        if (!product) return [];

        const images = [];

        // Add main image first
        if (product.main_image_url || product.main_image) {
            images.push({
                itemImageSrc: product.main_image_url || product.main_image,
                thumbnailImageSrc: product.main_image_url || product.main_image,
                alt: product.name
            });
        }

        // Add product_images
        if (product.product_images && product.product_images.length > 0) {
            product.product_images.forEach((img) => {
                images.push({
                    itemImageSrc: img.image_url || img.image,
                    thumbnailImageSrc: img.image_url || img.image,
                    alt: product.name
                });
            });
        }

        // Fallback if no images
        if (images.length === 0) {
            images.push({
                itemImageSrc: '/demo/images/product/placeholder.png',
                thumbnailImageSrc: '/demo/images/product/placeholder.png',
                alt: product.name
            });
        }

        return images;
    };

    const itemTemplate = (item: any) => {
        return <img src={item.itemImageSrc} alt={item.alt} style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'contain' }} />;
    };

    const thumbnailTemplate = (item: any) => {
        return <img src={item.thumbnailImageSrc} alt={item.alt} style={{ width: '100%', display: 'block', cursor: 'pointer' }} />;
    };

    if (loading) {
        return (
            <div className="card">
                <Toast ref={toast} />
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <Skeleton width="100%" height="500px" />
                    </div>
                    <div className="col-12 md:col-6">
                        <Skeleton width="80%" height="2rem" className="mb-3" />
                        <Skeleton width="60%" height="1.5rem" className="mb-3" />
                        <Skeleton width="100%" height="4rem" className="mb-3" />
                        <Skeleton width="50%" height="3rem" className="mb-3" />
                        <Skeleton width="100%" height="3rem" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="card text-center p-5">
                <Toast ref={toast} />
                <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
                <h3>Không tìm thấy sản phẩm</h3>
                <p className="text-600 mb-4">Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
                <Button label="Quay lại danh sách" icon="pi pi-arrow-left" onClick={() => router.push('/customer/products')} />
            </div>
        );
    }

    const images = getAllImages();
    const hasDiscount = product.old_price && product.old_price > product.price;

    // Prepare specifications table data
    const specificationsData = [];
    if (product.origin) specificationsData.push({ label: 'Xuất xứ', value: product.origin });
    if (product.weight) specificationsData.push({ label: 'Trọng lượng', value: product.weight });
    if (product.preservation) specificationsData.push({ label: 'Bảo quản', value: product.preservation });
    if (product.expiry) specificationsData.push({ label: 'Hạn sử dụng', value: product.expiry });
    if (product.certification) specificationsData.push({ label: 'Chứng nhận', value: product.certification });

    // Add custom specifications
    if (product.specifications_dict && Object.keys(product.specifications_dict).length > 0) {
        Object.entries(product.specifications_dict).forEach(([key, value]) => {
            specificationsData.push({ label: key, value });
        });
    }

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                <div className="card">
                    <div className="mb-3">
                        <Button label="Quay lại" icon="pi pi-arrow-left" text onClick={() => router.push('/customer/products')} />
                    </div>

                    <div className="grid">
                        {/* Product Images */}
                        <div className="col-12 md:col-6">
                            <Galleria value={images} numVisible={5} style={{ maxWidth: '100%' }} showThumbnails showItemNavigators item={itemTemplate} thumbnail={thumbnailTemplate} />
                        </div>

                        {/* Product Info */}
                        <div className="col-12 md:col-6">
                            <div className="flex align-items-center gap-2 mb-2">
                                <Tag value={product.category_name} severity="info" />
                                {hasDiscount && <Tag value={`GIẢM ${product.discount_percentage}%`} severity="danger" />}
                                {!product.in_stock && <Tag value="HẾT HÀNG" severity="warning" />}
                            </div>

                            <h1 className="text-4xl font-bold text-900 mb-3">{product.name}</h1>

                            <div className="flex align-items-center gap-3 mb-4">
                                <Rating value={product.rating} readOnly cancel={false} />
                                <span className="text-600">({product.reviews_count} đánh giá)</span>
                                <Divider layout="vertical" />
                                <span className="text-600">Đã bán: {product.sold_count}</span>
                            </div>

                            {product.description && (
                                <div className="mb-4">
                                    <p className="text-lg text-700 line-height-3">{product.description}</p>
                                </div>
                            )}

                            <div className="bg-primary-50 border-round p-4 mb-4">
                                <div className="flex align-items-end gap-3 mb-2">
                                    {hasDiscount && (
                                        <div className="text-xl text-500 line-through">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.old_price!)}</div>
                                    )}
                                    <div className="text-4xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</div>
                                    <div className="text-xl text-600">/ {product.unit}</div>
                                </div>
                                <div className="text-600">
                                    Tình trạng: <span className={`font-semibold ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>{product.in_stock ? `Còn ${product.stock} ${product.unit}` : 'Hết hàng'}</span>
                                </div>
                            </div>

                            {product.in_stock && (
                                <div className="mb-4">
                                    <label className="block text-900 font-medium mb-2">Số lượng</label>
                                    <InputNumber
                                        value={quantity}
                                        onValueChange={(e) => setQuantity(e.value || 1)}
                                        showButtons
                                        buttonLayout="horizontal"
                                        step={1}
                                        min={1}
                                        max={product.stock}
                                        decrementButtonClassName="p-button-outlined"
                                        incrementButtonClassName="p-button-outlined"
                                        incrementButtonIcon="pi pi-plus"
                                        decrementButtonIcon="pi pi-minus"
                                        className="w-full"
                                        inputClassName="text-center"
                                        suffix={` ${product.unit}`}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 mb-4">
                                <Button label="Thêm vào giỏ" icon="pi pi-shopping-cart" className="flex-1" disabled={!product.in_stock} onClick={addToCart} />
                                <Button label="Mua ngay" icon="pi pi-bolt" className="flex-1" severity="danger" disabled={!product.in_stock} onClick={buyNow} />
                            </div>

                            <div className="surface-100 border-round p-3">
                                <div className="flex align-items-center gap-2 mb-2">
                                    <i className="pi pi-shield-check text-green-600"></i>
                                    <span className="text-600">Cam kết 100% chính hãng</span>
                                </div>
                                <div className="flex align-items-center gap-2 mb-2">
                                    <i className="pi pi-truck text-blue-600"></i>
                                    <span className="text-600">Giao hàng nhanh trong 2 giờ</span>
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-refresh text-orange-600"></i>
                                    <span className="text-600">Đổi trả dễ dàng trong 7 ngày</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Details Tabs */}
            <div className="col-12">
                <div className="card">
                    <TabView>
                        <TabPanel header="Mô tả chi tiết" leftIcon="pi pi-info-circle mr-2">
                            <div className="line-height-3 text-700">
                                {product.detail_description ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.detail_description.replace(/\n/g, '<br/>') }} />
                                ) : (
                                    <p>{product.description}</p>
                                )}
                            </div>
                        </TabPanel>

                        <TabPanel header="Thông số kỹ thuật" leftIcon="pi pi-list mr-2">
                            {specificationsData.length > 0 ? (
                                <DataTable value={specificationsData} stripedRows>
                                    <Column field="label" header="Thông số" style={{ width: '30%' }} className="font-semibold"></Column>
                                    <Column field="value" header="Giá trị"></Column>
                                </DataTable>
                            ) : (
                                <p className="text-600">Không có thông số kỹ thuật</p>
                            )}
                        </TabPanel>

                        <TabPanel header={`Đánh giá (${product.reviews_count})`} leftIcon="pi pi-star mr-2">
                            <div className="text-center p-5 text-600">
                                <i className="pi pi-comment text-4xl mb-3"></i>
                                <p>Chức năng đánh giá sẽ được cập nhật sớm</p>
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
