from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.inventory import Inventory
from app.models.order import Order
from app.models.product import Product
from app.schemas.admin_analytics import (
    AdminAnalyticsSummary,
    AdminHourlySalesPoint,
    AdminKpiSummary,
    AdminLowInventoryItem,
    AdminRecentOrder,
    AdminSalesSeries,
    AdminSalesSeriesPoint,
    AdminTopProduct,
)


def _is_today(value: datetime, today: datetime) -> bool:
    return value.date() == today.date()


def _order_origin(order: Order) -> str:
    return "Cliente" if order.user_id is not None else "Totem"


def _customer_label(order: Order) -> str:
    if order.customer_name:
        return order.customer_name
    if order.user is not None:
        return order.user.full_name
    if order.user_id is not None:
        return f"Usuario {order.user_id}"
    return "Totem"


def get_admin_analytics_summary(db: Session, now: datetime | None = None) -> AdminAnalyticsSummary:
    reference_now = now or datetime.now()
    orders = list(
        db.scalars(
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.user))
            .order_by(Order.created_at.desc())
        )
    )
    products = {
        product.id: product
        for product in db.scalars(select(Product))
    }
    inventory_records = list(
        db.scalars(
            select(Inventory)
            .options(selectinload(Inventory.product), selectinload(Inventory.variant))
            .order_by(Inventory.quantity.asc())
        )
    )

    today_orders = [order for order in orders if _is_today(order.created_at, reference_now)]
    sales_today = sum((Decimal(order.total_amount) for order in today_orders), Decimal("0"))
    items_sold_today = sum(item.quantity for order in today_orders for item in order.items)
    average_ticket = sales_today / len(today_orders) if today_orders else Decimal("0")
    customers_served_today = len({
        order.user_id if order.user_id is not None else f"totem:{order.customer_name or order.id}"
        for order in today_orders
    })

    recent_orders = [
        AdminRecentOrder(
            id=order.id,
            created_at=order.created_at.isoformat(),
            customer_label=_customer_label(order),
            origin=_order_origin(order),
            items_count=sum(item.quantity for item in order.items),
            total_amount=Decimal(order.total_amount),
            status=order.status,
        )
        for order in orders[:8]
    ]

    low_inventory = [
        AdminLowInventoryItem(
            inventory_id=inventory.id,
            product_id=inventory.product_id,
            variant_id=inventory.variant_id,
            product_name=inventory.product.name if inventory.product else f"Produto {inventory.product_id}",
            variant_name=inventory.variant.name if inventory.variant else None,
            quantity=inventory.quantity,
            min_quantity=inventory.min_quantity,
            severity="critical" if inventory.quantity == 0 else "low",
        )
        for inventory in inventory_records
        if inventory.quantity <= inventory.min_quantity
    ][:8]

    product_totals: dict[int, dict[str, Decimal | int]] = defaultdict(lambda: {"quantity": 0, "revenue": Decimal("0")})
    hourly_totals = {hour: {"total_amount": Decimal("0"), "orders_count": 0} for hour in range(24)}
    for order in today_orders:
        hour_bucket = hourly_totals[order.created_at.hour]
        hour_bucket["total_amount"] = Decimal(hour_bucket["total_amount"]) + Decimal(order.total_amount)
        hour_bucket["orders_count"] = int(hour_bucket["orders_count"]) + 1
        for item in order.items:
            product_total = product_totals[item.product_id]
            product_total["quantity"] = int(product_total["quantity"]) + item.quantity
            product_total["revenue"] = Decimal(product_total["revenue"]) + Decimal(item.total_price)

    top_products = [
        AdminTopProduct(
            product_id=product_id,
            product_name=products[product_id].name if product_id in products else f"Produto {product_id}",
            image_url=products[product_id].image_url if product_id in products else None,
            quantity=int(data["quantity"]),
            revenue=Decimal(data["revenue"]),
        )
        for product_id, data in sorted(product_totals.items(), key=lambda item: int(item[1]["quantity"]), reverse=True)[:6]
    ]

    hourly_sales = [
        AdminHourlySalesPoint(
            hour=hour,
            total_amount=Decimal(data["total_amount"]),
            orders_count=int(data["orders_count"]),
        )
        for hour, data in hourly_totals.items()
    ]

    return AdminAnalyticsSummary(
        kpis=AdminKpiSummary(
            sales_today=sales_today,
            orders_today=len(today_orders),
            average_ticket=average_ticket,
            items_sold_today=items_sold_today,
            customers_served_today=customers_served_today,
        ),
        recent_orders=recent_orders,
        low_inventory=low_inventory,
        top_products=top_products,
        hourly_sales=hourly_sales,
    )


def _load_orders_for_series(db: Session) -> list[Order]:
    return list(db.scalars(select(Order).order_by(Order.created_at.asc())))


def _week_start(value: date) -> date:
    return value - timedelta(days=value.weekday())


def get_admin_sales_series(db: Session, period: str, now: datetime | None = None) -> AdminSalesSeries:
    reference_now = now or datetime.now()
    orders = _load_orders_for_series(db)

    if period == "hour":
        today = reference_now.date()
        buckets = {
            f"{hour:02d}": {
                "label": f"{hour:02d}h",
                "total_amount": Decimal("0"),
                "orders_count": 0,
            }
            for hour in range(24)
        }
        for order in orders:
            if order.created_at.date() != today:
                continue
            key = f"{order.created_at.hour:02d}"
            buckets[key]["total_amount"] = Decimal(buckets[key]["total_amount"]) + Decimal(order.total_amount)
            buckets[key]["orders_count"] = int(buckets[key]["orders_count"]) + 1

    elif period == "day":
        start = reference_now.date() - timedelta(days=13)
        days = [start + timedelta(days=offset) for offset in range(14)]
        buckets = {
            day.isoformat(): {
                "label": day.strftime("%d/%m"),
                "total_amount": Decimal("0"),
                "orders_count": 0,
            }
            for day in days
        }
        for order in orders:
            key_date = order.created_at.date()
            key = key_date.isoformat()
            if key not in buckets:
                continue
            buckets[key]["total_amount"] = Decimal(buckets[key]["total_amount"]) + Decimal(order.total_amount)
            buckets[key]["orders_count"] = int(buckets[key]["orders_count"]) + 1

    elif period == "week":
        current_week = _week_start(reference_now.date())
        weeks = [current_week - timedelta(weeks=offset) for offset in reversed(range(8))]
        buckets = {
            week.isoformat(): {
                "label": week.strftime("%d/%m"),
                "total_amount": Decimal("0"),
                "orders_count": 0,
            }
            for week in weeks
        }
        for order in orders:
            key = _week_start(order.created_at.date()).isoformat()
            if key not in buckets:
                continue
            buckets[key]["total_amount"] = Decimal(buckets[key]["total_amount"]) + Decimal(order.total_amount)
            buckets[key]["orders_count"] = int(buckets[key]["orders_count"]) + 1

    elif period == "month":
        month_cursor = date(reference_now.year, reference_now.month, 1)
        months: list[date] = []
        for _ in range(12):
            months.append(month_cursor)
            if month_cursor.month == 1:
                month_cursor = date(month_cursor.year - 1, 12, 1)
            else:
                month_cursor = date(month_cursor.year, month_cursor.month - 1, 1)
        months.reverse()
        buckets = {
            month.isoformat(): {
                "label": month.strftime("%m/%Y"),
                "total_amount": Decimal("0"),
                "orders_count": 0,
            }
            for month in months
        }
        for order in orders:
            order_month = date(order.created_at.year, order.created_at.month, 1)
            key = order_month.isoformat()
            if key not in buckets:
                continue
            buckets[key]["total_amount"] = Decimal(buckets[key]["total_amount"]) + Decimal(order.total_amount)
            buckets[key]["orders_count"] = int(buckets[key]["orders_count"]) + 1

    else:
        buckets = {}

    return AdminSalesSeries(
        period=period,
        points=[
            AdminSalesSeriesPoint(
                key=key,
                label=str(data["label"]),
                total_amount=Decimal(data["total_amount"]),
                orders_count=int(data["orders_count"]),
            )
            for key, data in buckets.items()
        ],
    )
