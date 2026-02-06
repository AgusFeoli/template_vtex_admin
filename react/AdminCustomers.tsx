import React, { useEffect, useState, useCallback } from 'react'
import { useRuntime } from 'vtex.render-runtime'
import { defineMessages, FormattedMessage, useIntl } from 'react-intl'
import {
  experimental_I18nProvider as I18nProvider,
  createSystem,
  DataGrid,
  DataView,
  DataViewControls,
  FlexSpacer,
  PageHeader,
  PageTitle,
  Pagination,
  Search,
  ToastProvider,
  useDataGridState,
  useDataViewState,
  usePaginationState,
  useSearchState,
  useToast,
} from '@vtex/admin-ui'

const [ThemeProvider] = createSystem({
  key: 'admin-customers',
})

const messages = defineMessages({
  title: {
    id: 'admin/admin-customers.title',
    defaultMessage: 'Customer List',
  },
  columnName: {
    id: 'admin/admin-customers.column.name',
    defaultMessage: 'Name',
  },
  columnEmail: {
    id: 'admin/admin-customers.column.email',
    defaultMessage: 'Email',
  },
  columnPhone: {
    id: 'admin/admin-customers.column.phone',
    defaultMessage: 'Phone',
  },
  columnCreatedIn: {
    id: 'admin/admin-customers.column.createdIn',
    defaultMessage: 'Registration Date',
  },
  searchPlaceholder: {
    id: 'admin/admin-customers.search.placeholder',
    defaultMessage: 'Search by name or email',
  },
  loading: {
    id: 'admin/admin-customers.loading',
    defaultMessage: 'Loading customers...',
  },
  error: {
    id: 'admin/admin-customers.error',
    defaultMessage: 'Failed to load customers',
  },
  noData: {
    id: 'admin/admin-customers.noData',
    defaultMessage: 'No customers found',
  },
})

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdIn: string
}

interface CustomerResponse {
  data: Customer[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

const PAGE_SIZE = 15

function CustomersContent() {
  const intl = useIntl()
  const showToast = useToast()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  const view = useDataViewState()
  const search = useSearchState()
  const pagination = usePaginationState({
    pageSize: PAGE_SIZE,
    total: totalItems,
  })

  const grid = useDataGridState({
    columns: [
      {
        id: 'name',
        header: intl.formatMessage(messages.columnName),
        accessor: (item: Customer) =>
          `${item.firstName || ''} ${item.lastName || ''}`.trim() || '-',
      },
      {
        id: 'email',
        header: intl.formatMessage(messages.columnEmail),
        accessor: (item: Customer) => item.email || '-',
      },
      {
        id: 'phone',
        header: intl.formatMessage(messages.columnPhone),
        accessor: (item: Customer) => item.phone || '-',
      },
      {
        id: 'createdIn',
        header: intl.formatMessage(messages.columnCreatedIn),
        accessor: (item: Customer) => {
          if (!item.createdIn) return '-'
          const date = new Date(item.createdIn)

          return date.toLocaleDateString(intl.locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        },
      },
    ],
    items: customers,
  })

  const fetchCustomers = useCallback(
    async (page: number, searchTerm: string) => {
      setLoading(true)
      view.setStatus({ type: 'loading' })

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        })

        if (searchTerm) {
          params.append('search', searchTerm)
        }

        // Use relative URL - VTEX IO routes the request through the service infrastructure
        const response = await fetch(`/_v/customers?${params}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result: CustomerResponse = await response.json()

        setCustomers(result.data || [])
        setTotalItems(result.pagination?.total || 0)

        if (result.data?.length === 0) {
          view.setStatus({
            type: 'empty',
            message: intl.formatMessage(messages.noData),
          })
        } else {
          view.setStatus({ type: 'ready' })
        }
      } catch (error) {
        console.error('Error fetching customers:', error)
        view.setStatus({
          type: 'error',
          message: intl.formatMessage(messages.error),
        })
        showToast({
          message: intl.formatMessage(messages.error),
          tone: 'critical',
        })
      } finally {
        setLoading(false)
      }
    },
    [intl, view, showToast]
  )

  useEffect(() => {
    // usePaginationState from @vtex/admin-ui is already 1-indexed (starts at 1)
    fetchCustomers(pagination.currentPage, search.debouncedValue || '')
  }, [pagination.currentPage, search.debouncedValue, fetchCustomers])

  return (
    <div style={{ padding: '1rem' }}>
      <PageHeader>
        <PageTitle>
          <FormattedMessage {...messages.title} />
        </PageTitle>
      </PageHeader>

      <DataView state={view}>
        <DataViewControls>
          <Search
            id="customer-search"
            placeholder={intl.formatMessage(messages.searchPlaceholder)}
            state={search}
          />
          <FlexSpacer />
          <Pagination
            state={pagination}
            preposition="of"
            subject="customers"
            prevLabel="Previous"
            nextLabel="Next"
            loading={loading}
          />
        </DataViewControls>

        <DataGrid state={grid} />
      </DataView>
    </div>
  )
}

function AdminCustomers() {
  const { culture } = useRuntime()
  const locale = culture?.locale || 'en-US'

  return (
    <ThemeProvider>
      <ToastProvider>
        <I18nProvider locale={locale}>
          <CustomersContent />
        </I18nProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default AdminCustomers
