/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { DataView } from 'primereact/dataview';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Rating } from 'primereact/rating';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Sidebar } from 'primereact/sidebar';
import React, { useRef, useState } from 'react';
import { classNames } from 'primereact/utils';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    rating: number;
    reviews: number;
    description: string;
    image: string;
}

const ProductsPage = () => {
    const [products] = useState<Product[]>([
        {
            id: 1,
            name: 'Cải Thảo Hữu Cơ',
            category: 'Rau Củ Quả',
            price: 25000,
            stock: 150,
            rating: 4.5,
            reviews: 24,
            description: 'Cải thảo hữu cơ tươi sạch, không hóa chất',
            image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300'
        },
        {
            id: 2,
            name: 'Thịt Bò Úc',
            category: 'Thịt Tươi',
            price: 350000,
            stock: 50,
            rating: 5,
            reviews: 45,
            description: 'Thịt bò Úc cao cấp nhập khẩu, đảm bảo chất lượng',
            image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300'
        },
        {
            id: 3,
            name: 'Tôm Sú Sống',
            category: 'Hải Sản',
            price: 280000,
            stock: 30,
            rating: 4.8,
            reviews: 32,
            description: 'Tôm sú tươi sống size lớn, nuôi tự nhiên',
            image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300'
        },
        {
            id: 4,
            name: 'Trứng Gà Organic',
            category: 'Trứng & Sữa',
            price: 65000,
            stock: 200,
            rating: 4.7,
            reviews: 89,
            description: 'Trứng gà organic hộp 10 quả, gà thả vườn',
            image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300'
        },
        {
            id: 5,
            name: 'Gạo ST25',
            category: 'Gạo & Ngũ Cốc',
            price: 120000,
            stock: 100,
            rating: 5,
            reviews: 156,
            description: 'Gạo ST25 cao cấp túi 5kg, thơm dẻo ngon',
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300'
        },
        {
            id: 6,
            name: 'Cà Chua Bi',
            category: 'Rau Củ Quả',
            price: 35000,
            stock: 80,
            rating: 4.3,
            reviews: 18,
            description: 'Cà chua bi Đà Lạt tươi ngon, ngọt tự nhiên',
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300'
        },
        {
            id: 7,
            name: 'Sữa Tươi Organicfarm',
            category: 'Trứng & Sữa',
            price: 45000,
            stock: 120,
            rating: 4.6,
            reviews: 67,
            description: 'Sữa tươi không đường 1 lít, nguồn gốc rõ ràng',
            image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300'
        },
        {
            id: 8,
            name: 'Cá Hồi Na Uy',
            category: 'Hải Sản',
            price: 420000,
            stock: 25,
            rating: 4.9,
            reviews: 38,
            description: 'Cá hồi Na Uy nhập khẩu, giàu omega-3',
            image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300'
        }
    ]);

    const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
    const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortKey, setSortKey] = useState<string>('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [categoryVisible, setCategoryVisible] = useState(false);
    const [cart, setCart] = useState<{ [key: number]: number }>({});
    const toast = useRef<Toast>(null);

    const categories = [
        { label: 'Tất cả', value: 'Tất cả' },
        { label: 'Rau Củ Quả', value: 'Rau Củ Quả' },
        { label: 'Thịt Tươi', value: 'Thịt Tươi' },
        { label: 'Hải Sản', value: 'Hải Sản' },
        { label: 'Trứng & Sữa', value: 'Trứng & Sữa' },
        { label: 'Gạo & Ngũ Cốc', value: 'Gạo & Ngũ Cốc' }
    ];

    const sortOptions = [
        { label: 'Giá: Thấp đến cao', value: 'price-asc' },
        { label: 'Giá: Cao đến thấp', value: 'price-desc' },
        { label: 'Đánh giá cao nhất', value: 'rating' },
        { label: 'Tên: A-Z', value: 'name' }
    ];

    React.useEffect(() => {
        let filtered = products;

        // Filter by category
        if (selectedCategory !== 'Tất cả') {
            filtered = filtered.filter((p) => p.category === selectedCategory);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // Sort
        if (sortKey) {
            filtered = [...filtered].sort((a, b) => {
                switch (sortKey) {
                    case 'price-asc':
                        return a.price - b.price;
                    case 'price-desc':
                        return b.price - a.price;
                    case 'rating':
                        return b.rating - a.rating;
                    case 'name':
                        return a.name.localeCompare(b.name);
                    default:
                        return 0;
                }
            });
        }

        setFilteredProducts(filtered);
    }, [selectedCategory, searchTerm, sortKey, products]);

    const addToCart = (product: Product) => {
        setCart((prev) => ({
            ...prev,
            [product.id]: (prev[product.id] || 0) + 1
        }));
        toast.current?.show({
            severity: 'success',
            summary: 'Đã thêm vào giỏ',
            detail: `${product.name} đã được thêm vào giỏ hàng`,
            life: 3000
        });
    };

    const itemTemplate = (product: Product) => {
        return (
            <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                <div className="product-card p-4 border-1 surface-border surface-card border-round h-full">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <Tag value={product.category} severity="info" className="text-sm"></Tag>
                    </div>

                    <div className="product-image-container mb-3 relative">
                        <img src={product.image} alt={product.name} className="product-image w-full border-round" style={{ height: '220px', objectFit: 'cover' }} />
                    </div>

                    <div className="product-info">
                        <div className="text-xl font-bold text-900 mb-2" style={{ minHeight: '2.5rem' }}>
                            {product.name}
                        </div>
                        <div className="text-sm text-600 mb-3 line-height-3" style={{ minHeight: '3rem' }}>
                            {product.description.length > 60 ? product.description.substring(0, 60) + '...' : product.description}
                        </div>

                        <div className="flex align-items-center gap-2 mb-3">
                            <Rating value={product.rating} readOnly cancel={false} className="text-sm" />
                            <span className="text-sm text-600">({product.reviews})</span>
                        </div>

                        <div className="flex align-items-end justify-content-between mb-3">
                            <div>
                                <div className="text-2xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</div>
                            </div>
                            <div className="text-sm text-600">
                                Còn: <span className="font-semibold text-900">{product.stock}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button label="Chi tiết" icon="pi pi-eye" className="flex-1 p-button-outlined" onClick={() => (window.location.href = `/customer/products/${product.id}`)} />
                            <Button icon="pi pi-shopping-cart" className="p-button-rounded" disabled={product.stock === 0} onClick={() => addToCart(product)} tooltip="Thêm vào giỏ" tooltipOptions={{ position: 'top' }} />
                        </div>

                        {cart[product.id] && (
                            <div className="mt-2 text-center">
                                <Tag value={`Trong giỏ: ${cart[product.id]}`} severity="success" className="w-full"></Tag>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const header = () => {
        return (
            <div className="flex flex-column md:flex-row md:justify-content-between gap-3">
                <div className="flex gap-2">
                    <Button icon="pi pi-filter" label="Lọc" outlined className="md:hidden" onClick={() => setFilterVisible(true)} />
                    <span className="p-input-icon-left flex-1">
                        <i className="pi pi-search" />
                        <InputText value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm sản phẩm..." className="w-full" />
                    </span>
                </div>
                <Dropdown value={sortKey} onChange={(e) => setSortKey(e.value)} options={sortOptions} placeholder="Sắp xếp theo" className="w-full md:w-14rem" />
            </div>
        );
    };

    const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    return (
        <div className="grid">
            <Toast ref={toast} />

            {/* Sidebar Filter for Mobile */}
            <Sidebar visible={filterVisible} onHide={() => setFilterVisible(false)}>
                <h3>Danh mục</h3>
                <div className="flex flex-column gap-2">
                    {categories.map((cat) => (
                        <Button
                            key={cat.value}
                            label={cat.label}
                            className={classNames('p-button-text justify-content-start', {
                                'p-button-outlined': selectedCategory === cat.value
                            })}
                            onClick={() => {
                                setSelectedCategory(cat.value);
                                setFilterVisible(false);
                            }}
                        />
                    ))}
                </div>
            </Sidebar>

            {/* Category Filter for Desktop */}
            {categoryVisible && (
                <div className="col-12 md:col-3 hidden md:block">
                    <div className="card">
                        <div className="flex justify-content-between align-items-center mb-3">
                            <h5 className="m-0">Danh mục</h5>
                            <Button icon="pi pi-times" rounded text severity="secondary" onClick={() => setCategoryVisible(false)} tooltip="Ẩn danh mục" tooltipOptions={{ position: 'left' }} />
                        </div>
                        <div className="flex flex-column gap-2">
                            {categories.map((cat) => (
                                <Button
                                    key={cat.value}
                                    label={cat.label}
                                    className={classNames('p-button-text justify-content-start', {
                                        'p-button-outlined': selectedCategory === cat.value
                                    })}
                                    onClick={() => setSelectedCategory(cat.value)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className={categoryVisible ? 'col-12 md:col-9' : 'col-12'}>
                <div className="card">
                    {!categoryVisible && (
                        <div className="mb-3">
                            <Button label="Hiển thị danh mục" icon="pi pi-list" outlined className="hidden md:inline-flex" onClick={() => setCategoryVisible(true)} />
                        </div>
                    )}
                    <DataView value={filteredProducts} itemTemplate={itemTemplate} layout="grid" header={header()} emptyMessage="Không tìm thấy sản phẩm nào" />
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;
