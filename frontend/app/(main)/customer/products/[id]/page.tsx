/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Rating } from 'primereact/rating';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Galleria } from 'primereact/galleria';
import { InputNumber } from 'primereact/inputnumber';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import { Avatar } from 'primereact/avatar';
import { Skeleton } from 'primereact/skeleton';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, reviewAPI } from '@/services/api';
import { useCart } from '@/layout/context/cartcontext';

interface Product {
    id: number;
    name: string;
    slug: string;
    category: number;
    category_name: string;
    category_detail?: {
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
    images: string;
    images_list: string[];
    product_images: Array<{
        id: number;
        image: string;
        image_url: string;
        is_main: boolean;
        order: number;
    }>;
    specifications: string;
    specifications_dict: { [key: string]: string };
    origin: string;
    weight: string;
    preservation: string;
    expiry: string;
    certification: string;
    status: string;
    in_stock: boolean;
    created_at: string;
    updated_at: string;
}

interface Review {
    id: number;
    user: number;
    user_name: string;
    user_email: string;
    product: number;
    product_name: string;
    product_image: string | null;
    order: number | null;
    order_number: string | null;
    rating: number;
    comment: string;
    images: string[];
    is_verified_purchase: boolean;
    is_approved: boolean;
    status: string;
    helpful_count: number;
    reply: string | null;
    reply_date: string | null;
    created_at: string;
    updated_at: string;
}

interface ReviewStats {
    total: number;
    average: number;
    breakdown: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

const ProductDetailPage = ({ params }: { params: { id: string } }) => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { addToCart: addToCartContext, loading: cartLoading } = useCart();
    const [quantity, setQuantity] = useState<number>(1);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [reviewStats, setReviewStats] = useState<ReviewStats>({
        total: 0,
        average: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    // Fetch product data
    useEffect(() => {
        loadProductData();
    }, [params.id]);

    // Fetch reviews when product changes
    useEffect(() => {
        if (product) {
            loadReviews();
        }
    }, [product?.id]);

    const loadProductData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch product by ID or slug
            const response = await productAPI.getByIdOrSlug(params.id);

            if (response && response.data) {
                setProduct(response.data);

                // Load related products (same category)
                if (response.data.category) {
                    loadRelatedProducts(response.data.category, response.data.id);
                }
            } else {
                setError('Không tìm thấy sản phẩm');
            }
        } catch (err: any) {
            console.error('Error loading product:', err);
            setError(err.message || 'Không thể tải thông tin sản phẩm');
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải thông tin sản phẩm',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const loadRelatedProducts = async (categoryId: number, currentProductId: number) => {
        try {
            const response = await productAPI.getAll({
                category: categoryId,
                status: 'active',
                page_size: 8
            });

            if (response && response.results) {
                // Filter out current product and limit to 4
                const filtered = response.results.filter((p: Product) => p.id !== currentProductId).slice(0, 4);
                setRelatedProducts(filtered);
            }
        } catch (err) {
            console.error('Error loading related products:', err);
        }
    };

    const loadReviews = async () => {
        if (!product?.id) return;

        setReviewsLoading(true);
        try {
            // Get reviews by product
            const reviewsData = await reviewAPI.getByProduct(product.id);

            if (reviewsData && Array.isArray(reviewsData)) {
                setReviews(reviewsData);

                // Calculate review statistics
                if (reviewsData.length > 0) {
                    const stats: ReviewStats = {
                        total: reviewsData.length,
                        average: 0,
                        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    };

                    let totalRating = 0;
                    reviewsData.forEach((review: Review) => {
                        totalRating += review.rating;
                        stats.breakdown[review.rating as keyof typeof stats.breakdown]++;
                    });

                    stats.average = totalRating / reviewsData.length;
                    setReviewStats(stats);
                } else {
                    setReviewStats({
                        total: 0,
                        average: 0,
                        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    });
                }
            }
        } catch (err) {
            console.error('Error loading reviews:', err);
            setReviews([]);
            setReviewStats({
                total: 0,
                average: 0,
                breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            });
        } finally {
            setReviewsLoading(false);
        }
    };

    // Prepare images for gallery
    const getProductImages = () => {
        if (!product) return [];

        const images: string[] = [];

        // Add main image first
        if (product.main_image_url) {
            images.push(product.main_image_url);
        }

        // Add product images
        if (product.product_images && product.product_images.length > 0) {
            product.product_images.forEach((img) => {
                if (img.image_url && img.image_url !== product.main_image_url) {
                    images.push(img.image_url);
                }
            });
        }

        // Add images from list if available
        if (product.images_list && product.images_list.length > 0) {
            product.images_list.forEach((url) => {
                if (url && !images.includes(url)) {
                    images.push(url);
                }
            });
        }

        // Fallback placeholder if no images
        if (images.length === 0) {
            images.push('/demo/images/product/placeholder.png');
        }

        return images;
    };

    // Prepare specifications
    const getSpecifications = () => {
        if (!product) return [];

        const specs: { label: string; value: string }[] = [];

        if (product.origin) {
            specs.push({ label: 'Xuất xứ', value: product.origin });
        }
        if (product.weight) {
            specs.push({ label: 'Trọng lượng', value: product.weight });
        }
        if (product.preservation) {
            specs.push({ label: 'Bảo quản', value: product.preservation });
        }
        if (product.expiry) {
            specs.push({ label: 'Hạn sử dụng', value: product.expiry });
        }
        if (product.certification) {
            specs.push({ label: 'Chứng nhận', value: product.certification });
        }

        // Add specifications from dict if available
        if (product.specifications_dict && Object.keys(product.specifications_dict).length > 0) {
            Object.entries(product.specifications_dict).forEach(([key, value]) => {
                if (!specs.find((s) => s.label === key)) {
                    specs.push({ label: key, value: String(value) });
                }
            });
        }

        return specs;
    };

    const itemTemplate = (item: string) => {
        return <img src={item} alt="Product" style={{ width: '100%', display: 'block' }} />;
    };

    const thumbnailTemplate = (item: string) => {
        return <img src={item} alt="Thumbnail" style={{ width: '100px', display: 'block', cursor: 'pointer' }} />;
    };

    const addToCart = async () => {
        if (!product) return;

        try {
            await addToCartContext(product, quantity);
            toast.current?.show({
                severity: 'success',
                summary: 'Đã thêm vào giỏ',
                detail: `Đã thêm ${quantity} ${product.unit} ${product.name} vào giỏ hàng`,
                life: 3000
            });
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || 'Không thể thêm sản phẩm vào giỏ hàng';
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: errorMessage,
                life: 3000
            });
        }
    };

    const buyNow = async () => {
        await addToCart();
        router.push('/customer/cart');
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <Skeleton width="100%" height="2rem" className="mb-3" />
                </div>
                <div className="col-12">
                    <div className="card">
                        <div className="grid">
                            <div className="col-12 md:col-5">
                                <Skeleton width="100%" height="400px" />
                            </div>
                            <div className="col-12 md:col-7">
                                <Skeleton width="80%" height="3rem" className="mb-3" />
                                <Skeleton width="60%" height="2rem" className="mb-3" />
                                <Skeleton width="100%" height="6rem" className="mb-3" />
                                <Skeleton width="100%" height="4rem" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !product) {
        return (
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <div className="card text-center p-5">
                        <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
                        <h2 className="text-900 mb-3">{error || 'Không tìm thấy sản phẩm'}</h2>
                        <Button label="Quay lại danh sách sản phẩm" icon="pi pi-arrow-left" onClick={() => router.push('/customer/products')} />
                    </div>
                </div>
            </div>
        );
    }

    const productImages = getProductImages();
    const specifications = getSpecifications();
    const hasDiscount = product.old_price && product.old_price > product.price;

    return (
        <div className="grid">
            <Toast ref={toast} />

            {/* Breadcrumb */}
            <div className="col-12">
                <div className="flex align-items-center gap-2 text-600">
                    <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/customer/products')}>
                        Sản phẩm
                    </span>
                    <i className="pi pi-angle-right text-sm" />
                    <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/customer/products')}>
                        {product.category_name}
                    </span>
                    <i className="pi pi-angle-right text-sm" />
                    <span className="text-900 font-semibold">{product.name}</span>
                </div>
            </div>

            {/* Product Detail */}
            <div className="col-12">
                <div className="card">
                    <div className="grid">
                        {/* Images */}
                        <div className="col-12 md:col-5">
                            <Galleria value={productImages} item={itemTemplate} thumbnail={thumbnailTemplate} numVisible={4} circular showItemNavigators showThumbnails thumbnailsPosition="left" style={{ maxWidth: '100%' }} />
                        </div>

                        {/* Product Info */}
                        <div className="col-12 md:col-7">
                            <div className="flex align-items-center gap-2 mb-3">
                                <Tag value={product.category_name} severity="info"></Tag>
                                {!product.in_stock && <Tag value="Hết hàng" severity="danger"></Tag>}
                                {product.in_stock && product.stock < 50 && <Tag value="Sắp hết hàng" severity="warning"></Tag>}
                                {hasDiscount && <Tag value={`-${product.discount_percentage}%`} severity="success"></Tag>}
                            </div>

                            <h1 className="text-4xl font-bold text-900 mb-3">{product.name}</h1>

                            <div className="flex align-items-center gap-3 mb-4">
                                <Rating value={product.rating} readOnly cancel={false} />
                                <span className="text-600">({product.reviews_count} đánh giá)</span>
                                <Divider layout="vertical" />
                                <span className="text-600">
                                    Đã bán: <span className="font-semibold text-900">{product.sold_count}</span>
                                </span>
                            </div>

                            <div className="surface-100 p-4 border-round mb-4">
                                <div className="flex align-items-baseline gap-3 mb-2">
                                    {hasDiscount && (
                                        <>
                                            <span className="text-3xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                                            <span className="text-xl text-500 line-through">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.old_price!)}</span>
                                            <Tag value={`-${product.discount_percentage}%`} severity="danger" className="text-sm" />
                                        </>
                                    )}
                                    {!hasDiscount && <span className="text-3xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>}
                                </div>
                                <div className="text-sm text-600">
                                    Tình trạng:{' '}
                                    <span className="font-semibold text-900">
                                        Còn {product.stock} {product.unit}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-900 mb-2">Mô tả ngắn</h3>
                                <p className="text-600 line-height-3">{product.description}</p>
                            </div>

                            <Divider />

                            <div className="flex align-items-center gap-4 mb-4">
                                <span className="text-900 font-semibold">Số lượng:</span>
                                <InputNumber
                                    value={quantity}
                                    onValueChange={(e) => setQuantity(e.value || 1)}
                                    mode="decimal"
                                    showButtons
                                    min={1}
                                    max={product.stock}
                                    buttonLayout="horizontal"
                                    decrementButtonClassName="p-button-secondary"
                                    incrementButtonClassName="p-button-secondary"
                                    incrementButtonIcon="pi pi-plus"
                                    decrementButtonIcon="pi pi-minus"
                                />
                            </div>

                            <div className="flex gap-3 mb-4">
                                <Button label="Thêm vào giỏ" icon="pi pi-shopping-cart" className="flex-1 p-button-outlined p-button-lg" onClick={addToCart} disabled={product.stock === 0 || cartLoading} loading={cartLoading} />
                                <Button label="Mua ngay" icon="pi pi-bolt" className="flex-1 p-button-lg" onClick={buyNow} disabled={product.stock === 0 || cartLoading} loading={cartLoading} />
                            </div>

                            <div className="surface-50 p-3 border-round">
                                <div className="flex align-items-center gap-3 mb-2">
                                    <i className="pi pi-shield-check text-primary text-2xl"></i>
                                    <span className="text-900">Đảm bảo chính hãng 100%</span>
                                </div>
                                <div className="flex align-items-center gap-3 mb-2">
                                    <i className="pi pi-truck text-primary text-2xl"></i>
                                    <span className="text-900">Miễn phí vận chuyển cho đơn hàng trên 200.000đ</span>
                                </div>
                                <div className="flex align-items-center gap-3">
                                    <i className="pi pi-refresh text-primary text-2xl"></i>
                                    <span className="text-900">Đổi trả trong vòng 24h nếu sản phẩm lỗi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs: Description, Specifications, Reviews */}
            <div className="col-12">
                <div className="card">
                    <TabView>
                        <TabPanel header="Mô tả chi tiết">
                            {product.detail_description ? (
                                <div className="text-600 line-height-3" dangerouslySetInnerHTML={{ __html: product.detail_description }} />
                            ) : (
                                <div className="text-600 line-height-3">
                                    <p>{product.description}</p>
                                </div>
                            )}
                        </TabPanel>

                        <TabPanel header="Thông số kỹ thuật">
                            <div className="grid">
                                {specifications.length > 0 ? (
                                    specifications.map((spec, index) => (
                                        <React.Fragment key={index}>
                                            <div className="col-12 md:col-4 font-semibold text-900 py-3">{spec.label}</div>
                                            <div className="col-12 md:col-8 text-600 py-3">{spec.value}</div>
                                            {index < specifications.length - 1 && (
                                                <div className="col-12">
                                                    <Divider />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <div className="col-12 text-center text-600">
                                        <p>Chưa có thông số kỹ thuật</p>
                                    </div>
                                )}
                            </div>
                        </TabPanel>

                        <TabPanel header={`Đánh giá (${reviewStats.total})`}>
                            {/* Review Statistics */}
                            <div className="grid mb-4">
                                <div className="col-12 md:col-4">
                                    <div className="surface-50 p-4 border-round text-center">
                                        <div className="text-5xl font-bold text-primary mb-2">{reviewStats.average.toFixed(1)}</div>
                                        <Rating value={Math.round(reviewStats.average)} readOnly cancel={false} className="mb-2" />
                                        <div className="text-600">{reviewStats.total} đánh giá</div>
                                    </div>
                                </div>
                                <div className="col-12 md:col-8">
                                    <div className="flex flex-column gap-2">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = reviewStats.breakdown[star as keyof typeof reviewStats.breakdown];
                                            const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                                            return (
                                                <div key={star} className="flex align-items-center gap-3">
                                                    <Button
                                                        label={`${star} ⭐`}
                                                        className={`p-button-sm ${selectedRating === star ? 'p-button-primary' : 'p-button-outlined'}`}
                                                        onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                                                        style={{ minWidth: '80px' }}
                                                    />
                                                    <div className="flex-1 surface-300 border-round" style={{ height: '8px' }}>
                                                        <div className="bg-primary border-round h-full" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                    <span className="text-600" style={{ minWidth: '40px' }}>
                                                        {count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <Divider />

                            {/* Reviews List */}
                            {reviewsLoading ? (
                                <div className="text-center py-5">
                                    <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                                    <div className="text-600 mt-3">Đang tải đánh giá...</div>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="pi pi-star text-6xl text-300 mb-3"></i>
                                    <div className="text-900 font-semibold mb-2">Chưa có đánh giá nào</div>
                                    <div className="text-600">Hãy là người đầu tiên đánh giá sản phẩm này!</div>
                                </div>
                            ) : (
                                <>
                                    {selectedRating && (
                                        <div className="mb-3">
                                            <Button label={`Hiển thị tất cả đánh giá (${reviewStats.total})`} icon="pi pi-times" className="p-button-text p-button-sm" onClick={() => setSelectedRating(null)} />
                                        </div>
                                    )}

                                    {reviews
                                        .filter((review) => !selectedRating || review.rating === selectedRating)
                                        .map((review) => (
                                            <div key={review.id} className="mb-4">
                                                <div className="flex gap-3">
                                                    <Avatar label={review.user_name.charAt(0).toUpperCase()} size="large" shape="circle" style={{ backgroundColor: '#2196F3', color: '#ffffff' }} />
                                                    <div className="flex-1">
                                                        <div className="flex align-items-start justify-content-between mb-2">
                                                            <div className="flex-1">
                                                                <div className="flex align-items-center gap-2 mb-1">
                                                                    <div className="font-semibold text-900">{review.user_name}</div>
                                                                    {review.is_verified_purchase && <Tag value="Đã mua hàng" severity="success" className="text-xs" />}
                                                                </div>
                                                                <Rating value={review.rating} readOnly cancel={false} className="text-sm" />
                                                            </div>
                                                            <span className="text-sm text-600">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <p className="text-600 line-height-3 m-0 mb-3">{review.comment}</p>

                                                        {/* Review Images */}
                                                        {review.images && review.images.length > 0 && (
                                                            <div className="flex gap-2 mb-3">
                                                                {review.images.map((image, idx) => (
                                                                    <img key={idx} src={image} alt={`Review ${idx + 1}`} className="border-round" style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer' }} />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Admin Reply */}
                                                        {review.reply && (
                                                            <div className="surface-50 p-3 border-round mt-3">
                                                                <div className="flex align-items-center gap-2 mb-2">
                                                                    <i className="pi pi-reply text-primary"></i>
                                                                    <span className="font-semibold text-900">Phản hồi từ người bán</span>
                                                                    {review.reply_date && <span className="text-sm text-600">{new Date(review.reply_date).toLocaleDateString('vi-VN')}</span>}
                                                                </div>
                                                                <p className="text-600 line-height-3 m-0">{review.reply}</p>
                                                            </div>
                                                        )}

                                                        {/* Helpful Count */}
                                                        {review.helpful_count > 0 && (
                                                            <div className="text-sm text-600 mt-2">
                                                                <i className="pi pi-thumbs-up mr-2"></i>
                                                                {review.helpful_count} người thấy hữu ích
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Divider />
                                            </div>
                                        ))}

                                    {selectedRating && reviews.filter((r) => r.rating === selectedRating).length === 0 && (
                                        <div className="text-center py-5">
                                            <i className="pi pi-star text-6xl text-300 mb-3"></i>
                                            <div className="text-900 font-semibold mb-2">Không có đánh giá {selectedRating} sao</div>
                                            <div className="text-600">Thử lọc theo số sao khác</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="col-12">
                    <div className="card">
                        <h3 className="text-2xl font-bold text-900 mb-4">Sản phẩm liên quan</h3>
                        <div className="grid">
                            {relatedProducts.map((relProduct) => {
                                const relProductImage = relProduct.main_image_url || relProduct.main_image || '/demo/images/product/placeholder.png';
                                return (
                                    <div key={relProduct.id} className="col-12 sm:col-6 md:col-4 lg:col-3">
                                        <div className="product-card p-3 border-1 surface-border border-round cursor-pointer hover:shadow-3 transition-duration-300" onClick={() => router.push(`/customer/products/${relProduct.slug}`)}>
                                            <img src={relProductImage} alt={relProduct.name} className="w-full border-round mb-3" style={{ height: '180px', objectFit: 'cover' }} />
                                            <div className="text-lg font-semibold text-900 mb-2">{relProduct.name}</div>
                                            <div className="flex align-items-center justify-content-between">
                                                <span className="text-xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(relProduct.price)}</span>
                                                <Rating value={relProduct.rating} readOnly cancel={false} className="text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetailPage;
