from decimal import Decimal

from pydantic import BaseModel


class AdminKpiSummary(BaseModel):
    sales_today: Decimal
    orders_today: int
    average_ticket: Decimal
    items_sold_today: int
    customers_served_today: int


class AdminRecentOrder(BaseModel):
    id: int
    created_at: str
    customer_label: str
    origin: str
    items_count: int
    total_amount: Decimal
    status: str


class AdminLowInventoryItem(BaseModel):
    inventory_id: int
    product_id: int
    variant_id: int | None
    product_name: str
    variant_name: str | None
    quantity: int
    min_quantity: int
    severity: str


class AdminTopProduct(BaseModel):
    product_id: int
    product_name: str
    image_url: str | None
    quantity: int
    revenue: Decimal


class AdminHourlySalesPoint(BaseModel):
    hour: int
    total_amount: Decimal
    orders_count: int


class AdminSalesSeriesPoint(BaseModel):
    key: str
    label: str
    total_amount: Decimal
    orders_count: int


class AdminSalesSeries(BaseModel):
    period: str
    points: list[AdminSalesSeriesPoint]


class AdminAnalyticsSummary(BaseModel):
    kpis: AdminKpiSummary
    recent_orders: list[AdminRecentOrder]
    low_inventory: list[AdminLowInventoryItem]
    top_products: list[AdminTopProduct]
    hourly_sales: list[AdminHourlySalesPoint]
