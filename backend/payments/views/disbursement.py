from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from accounts.utils.permissions import IsSystemAdmin
from ..models import Disbursement, Transaction
from ..serializers.disbursement import (
    DisbursementSerializer,
    DisbursementCreateSerializer,
    DisbursementUpdateSerializer,
    DisbursementDetailSerializer,
    DisbursementStatisticsSerializer,
)


class DisbursementViewSet(viewsets.ModelViewSet):
    """
    API endpoint for recording and managing disbursements to hospitals.
    
    Disbursements are records of payments already made outside the system (e.g., bank transfers,
    cash, mobile money). They default to COMPLETED status with an automatically created SUCCESSFUL
    transaction for audit trail purposes.
    
    **Permissions:**
    - System Admins: Full CRUD access to all disbursements
    - Handles payments externally to prevent hacking and unauthorized withdrawals
    
    **Features:**
    - Record manual disbursements made via external payment systems
    - Automatic transaction creation for audit trail
    - Link disbursements to external system references
    - Mark as failed (for corrections if needed)
    """
    queryset = Disbursement.objects.select_related(
        'hospital', 'transaction', 'created_by'
    ).order_by('-created_at')
    serializer_class = DisbursementSerializer
    permission_classes = [IsSystemAdmin]
    filterset_fields = ['status', 'payment_method', 'hospital']
    search_fields = ['external_reference', 'gateway_transaction_id', 'hospital__name']
    ordering_fields = ['amount', 'status', 'created_at', 'disbursed_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return DisbursementCreateSerializer
        elif self.action == 'partial_update':
            return DisbursementUpdateSerializer
        elif self.action == 'retrieve':
            return DisbursementDetailSerializer
        elif self.action == 'statistics':
            return DisbursementStatisticsSerializer
        return DisbursementSerializer

    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='List Disbursements',
        operation_description=(
            'List all disbursement records with optional filtering and search.\n\n'
            '**Filters:** `status`, `payment_method`, `hospital`\n\n'
            '**Search:** `external_reference`, `gateway_transaction_id`, `hospital__name`\n\n'
            '**Ordering:** `amount`, `status`, `created_at`, `disbursed_at`'
        ),
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='Create Disbursement Record',
        operation_description=(
            'Create a new disbursement record to document payments already made outside the system.\n\n'
            'Use this to record manual payments made via bank transfers, cash, mobile money, or other external systems. '
            'The disbursement automatically defaults to COMPLETED status since you\'re recording a payment that has already been made.\n\n'
            'A corresponding Transaction record is automatically created with SUCCESSFUL status and linked to this disbursement.\n\n'
            '**Required fields:** `hospital`, `amount`, `payment_method`\n\n'
            '**Optional fields:** `external_reference`, `gateway_transaction_id`, `recipient_phone`, `recipient_account`, '
            '`notes`, `metadata`, `disbursed_at`'
        ),
    )
    def create(self, request, *args, **kwargs):
        """Create disbursement and automatically create linked transaction."""
        # Set created_by to current user
        request.data['created_by'] = request.user.id
        
        with transaction.atomic():
            # Create disbursement using parent create method
            response = super().create(request, *args, **kwargs)
            
            # Only proceed if creation was successful (201)
            if response.status_code == status.HTTP_201_CREATED:
                disbursement = Disbursement.objects.get(id=response.data['id'])
                
                # Create linked transaction
                tx = Transaction.objects.create(
                    type='DISBURSEMENT',
                    direction=Transaction.Direction.OUT,
                    amount=disbursement.amount,
                    currency=disbursement.currency,
                    gateway_transaction_id=disbursement.gateway_transaction_id or None,
                    status='SUCCESSFUL',  # Defaults to SUCCESSFUL since this records payments already made
                    metadata={
                        'disbursement_id': str(disbursement.id),
                        'hospital_id': str(disbursement.hospital.id),
                        'payment_method': disbursement.payment_method,
                        'external_reference': disbursement.external_reference,
                        **(disbursement.metadata or {})
                    }
                )
                
                # Link transaction to disbursement
                disbursement.transaction = tx
                disbursement.save(update_fields=['transaction', 'updated_at'])
                
                # Update response with transaction info
                response.data['transaction_id'] = str(tx.id)
        
        return response

    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='Get Disbursement Details',
        operation_description='Retrieve detailed information about a specific disbursement including related events and transaction details.',
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='Update Disbursement',
        operation_description='Partially update a disbursement record. Commonly used to update status, add error messages, or link to transactions.',
        request_body=DisbursementUpdateSerializer,
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='Update Disbursement (Full)',
        operation_description='Fully update/replace a disbursement record.',
        request_body=DisbursementSerializer,
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)


    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='Delete Disbursement',
        operation_description='Delete a disbursement record (only for incomplete/test records).',
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='Mark as Completed',
        operation_description='Mark a disbursement as completed. Since disbursements default to COMPLETED, this is rarely needed except for correcting a previously failed entry or updating a PENDING record.',
        methods=['post'],
    )
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark a disbursement as completed."""
        disbursement = self.get_object()
        
        if disbursement.status == Disbursement.Status.COMPLETED:
            return Response(
                {'detail': 'Disbursement is already completed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            disbursement.status = Disbursement.Status.COMPLETED
            disbursement.save()
            
            # Update linked transaction status if it exists
            if disbursement.transaction:
                disbursement.transaction.status = 'SUCCESSFUL'
                disbursement.transaction.save(update_fields=['status', 'updated_at'])

        return Response(
            DisbursementDetailSerializer(disbursement).data,
            status=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='Mark as Failed',
        operation_description='Mark a disbursement as failed and record error details. Use this to correct a record if a payment you recorded actually failed or was rejected.',
        methods=['post'],
    )
    @action(detail=True, methods=['post'])
    def mark_failed(self, request, pk=None):
        """Mark a disbursement as failed."""
        disbursement = self.get_object()
        
        if disbursement.status == Disbursement.Status.FAILED:
            return Response(
                {'detail': 'Disbursement is already marked as failed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            disbursement.status = Disbursement.Status.FAILED
            disbursement.error_message = request.data.get('error_message', '')
            disbursement.save()
            
            # Update linked transaction status if it exists
            if disbursement.transaction:
                disbursement.transaction.status = 'FAILED'
                disbursement.transaction.metadata = disbursement.transaction.metadata or {}
                disbursement.transaction.metadata['error_message'] = request.data.get('error_message', '')
                disbursement.transaction.save(update_fields=['status', 'metadata', 'updated_at'])

        return Response(
            DisbursementDetailSerializer(disbursement).data,
            status=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='Get Disbursements by Hospital',
        operation_description='Get all disbursements for a specific hospital.',
        methods=['get'],
    )
    @action(detail=False, methods=['get'])
    def by_hospital(self, request):
        """Get disbursements filtered by hospital."""
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return Response(
                {'detail': 'hospital_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(hospital_id=hospital_id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        tags=['Disbursement'],
        operation_summary='Get Statistics',
        operation_description='Get aggregated disbursement statistics by status and payment method.',
        methods=['get'],
        responses={200: DisbursementStatisticsSerializer},
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get disbursement statistics."""
        from django.db.models import Sum, Count
        
        queryset = self.get_queryset()

        stats = {
            'total_disbursed': queryset.filter(
                status=Disbursement.Status.COMPLETED
            ).aggregate(total=Sum('amount'))['total'] or 0,
            'total_pending': queryset.filter(
                status=Disbursement.Status.PENDING
            ).aggregate(total=Sum('amount'))['total'] or 0,
            'total_failed': queryset.filter(
                status=Disbursement.Status.FAILED
            ).aggregate(total=Sum('amount'))['total'] or 0,
            'by_status': dict(
                queryset.values('status').annotate(
                    count=Count('id'),
                    total=Sum('amount')
                ).values_list('status', 'count', 'total')
            ),
            'by_payment_method': dict(
                queryset.values('payment_method').annotate(
                    count=Count('id'),
                    total=Sum('amount')
                ).values_list('payment_method', 'count', 'total')
            ),
            'total_count': queryset.count(),
        }

        return Response(stats, status=status.HTTP_200_OK)
