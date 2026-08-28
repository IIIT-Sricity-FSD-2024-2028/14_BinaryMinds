# TradeZo Platform Admin

Platform Admin is a company-level role, separate from every Municipal Corporation role. Configure its bootstrap login outside source control:

```env
PLATFORM_ADMIN_EMAIL=admin@your-company.example
PLATFORM_ADMIN_PASSWORD=use-a-long-unique-secret
```

The public landing page links to the separate `frontend/platform_admin/login/` page. That page sends `role: platform_admin` only to the existing `/api/auth/login` endpoint; it is not present in the municipal login selector.

All `/api/platform-admin/*` endpoints require a valid bearer token and `platform_admin`. Other authenticated roles are rejected with HTTP 403.

Revenue settings live at `platform.revenue_settings.tradezo_revenue_percentage` in `data/tradezo.json`. The rate is validated as an integer from 0 to 100. A completed payment produces at most one revenue record, keyed by `payment_id`; its rate and calculated values are immutable snapshots. Existing completed payments without a record are backfilled once at service startup using the current configured rate and marked `backfilled: true`, because no prior historical rate exists.
