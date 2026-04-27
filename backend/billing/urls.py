from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TimeEntryViewSet, ExpenseViewSet, InvoiceViewSet,
    PaymentViewSet, TrustAccountViewSet, AdvocateInvoiceViewSet,
    FinanceOverviewViewSet
)

router = DefaultRouter()
router.register(r'time-entries', TimeEntryViewSet, basename='timeentry')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'trust-accounts', TrustAccountViewSet, basename='trustaccount')
router.register(r'advocate-invoices', AdvocateInvoiceViewSet, basename='advocateinvoice')
router.register(r'finance-overview', FinanceOverviewViewSet, basename='financeoverview')

urlpatterns = [
    path('', include(router.urls)),
]
