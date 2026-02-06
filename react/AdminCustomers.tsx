import React, { useCallback, useEffect, useState, useRef } from 'react'
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
  Spinner,
  ToastProvider,
  useDataGridState,
  useDataViewState,
  usePaginationState,
  useSearchState,
  Center,
  Text,
} from '@vtex/admin-ui'

const ITEMS_PER_PAGE = 15

const [ThemeProvider] = createSystem({
  key: 'admin-customers',
})

const messages = defineMessages({
  title: {
    id: 'admin/admin-customers.title',
  },
  columnName: {
    id: 'admin/admin-customers.column.name',
  },
  columnEmail: {
    id: 'admin/admin-customers.column.email',
  },
  columnPhone: {
    id: 'admin/admin-customers.column.phone',
  },
  columnRegistrationDate: {
    id: 'admin/admin-customers.column.registrationDate',
  },
  searchPlaceholder: {
    id: 'admin/admin-customers.search.placeholder',
  },
  loading: {
    id: 'admin/admin-customers.loading',
  },
  noData: {
    id: 'admin/admin-customers.noData',
  },
  error: {
    id: 'admin/admin-customers.error',
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

interface PaginatedResponse {
  data: Customer[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

function AdminCustomers() {
  const {
    culture: { locale },
  } = useRuntime()
  const { formatMessage, formatDate } = useIntl()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const view = useDataViewState()
  const search = useSearchState()
  const pagination = usePaginationState({
    pageSize: ITEMS_PER_PAGE,
    total: 0,
  })

  // Track previous values to detect changes
  const prevRangeRef = useRef(pagination.range)
  const prevSearchRef = useRef(search.debouncedValue)

  // Calculate current page from range (range is 1-indexed)
  const getCurrentPage = useCallback(() => {
    return Math.ceil(pagination.range[0] / ITEMS_PER_PAGE)
  }, [pagination.range])

  // Fetch customers from server with pagination
  const fetchCustomers = useCallback(async (page: number, searchTerm?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: ITEMS_PER_PAGE.toString(),
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/_v/customers?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const result: PaginatedResponse = await response.json()

      setCustomers(result.data || [])
      setTotal(result.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setCustomers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchCustomers(1, '')
  }, [fetchCustomers])

  // Update total in pagination state when total changes
  useEffect(() => {
    pagination.paginate({ type: 'setTotal', total })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  // Handle pagination changes (when user clicks next/prev)
  useEffect(() => {
    const rangeChanged =
      prevRangeRef.current[0] !== pagination.range[0] ||
      prevRangeRef.current[1] !== pagination.range[1]

    if (rangeChanged && !loading) {
      prevRangeRef.current = pagination.range
      const page = getCurrentPage()

      fetchCustomers(page, search.debouncedValue || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.range])

  // Handle search changes
  useEffect(() => {
    const searchChanged = prevSearchRef.current !== search.debouncedValue

    if (searchChanged) {
      prevSearchRef.current = search.debouncedValue
      // Reset to first page when search changes
      pagination.paginate({ type: 'reset' })
      fetchCustomers(1, search.debouncedValue || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.debouncedValue])

  const grid = useDataGridState({
    view,
    columns: [
      {
        id: 'name',
        header: formatMessage(messages.columnName),
        resolver: {
          type: 'root',
          render: function Render({ item }: { item: Customer }) {
            const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim()

            return <span>{fullName || '-'}</span>
          },
        },
      },
      {
        id: 'email',
        header: formatMessage(messages.columnEmail),
        resolver: {
          type: 'root',
          render: function Render({ item }: { item: Customer }) {
            return <span>{item.email || '-'}</span>
          },
        },
      },
      {
        id: 'phone',
        header: formatMessage(messages.columnPhone),
        resolver: {
          type: 'root',
          render: function Render({ item }: { item: Customer }) {
            return <span>{item.phone || '-'}</span>
          },
        },
      },
      {
        id: 'createdIn',
        header: formatMessage(messages.columnRegistrationDate),
        resolver: {
          type: 'root',
          render: function Render({ item }: { item: Customer }) {
            if (!item.createdIn) {
              return <span>-</span>
            }

            try {
              return (
                <span>
                  {formatDate(new Date(item.createdIn), {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )
            } catch {
              return <span>-</span>
            }
          },
        },
      },
    ],
    items: customers,
    length: ITEMS_PER_PAGE,
  })

  if (loading && customers.length === 0) {
    return (
      <I18nProvider locale={locale}>
        <ThemeProvider>
          <PageHeader>
            <PageTitle>
              <FormattedMessage {...messages.title} />
            </PageTitle>
          </PageHeader>
          <Center style={{ height: '300px' }}>
            <Spinner />
          </Center>
        </ThemeProvider>
      </I18nProvider>
    )
  }

  if (error) {
    return (
      <I18nProvider locale={locale}>
        <ThemeProvider>
          <PageHeader>
            <PageTitle>
              <FormattedMessage {...messages.title} />
            </PageTitle>
          </PageHeader>
          <Center style={{ height: '300px' }}>
            <Text tone="critical">
              <FormattedMessage {...messages.error} />: {error}
            </Text>
          </Center>
        </ThemeProvider>
      </I18nProvider>
    )
  }

  return (
    <I18nProvider locale={locale}>
      <ThemeProvider>
        <ToastProvider>
          <PageHeader>
            <PageTitle>
              <FormattedMessage {...messages.title} />
            </PageTitle>
          </PageHeader>

          <div style={{ padding: '0 4rem' }}>
            <DataView state={view}>
              <DataViewControls>
                <Search
                  id="search"
                  placeholder={formatMessage(messages.searchPlaceholder)}
                  state={search}
                />
                <FlexSpacer />
                <Pagination
                  state={pagination}
                  preposition="of"
                  subject="results"
                  prevLabel="Previous"
                  nextLabel="Next"
                  loading={loading}
                />
              </DataViewControls>
              {customers.length === 0 ? (
                <Center style={{ height: '200px' }}>
                  <Text>
                    <FormattedMessage {...messages.noData} />
                  </Text>
                </Center>
              ) : (
                <DataGrid state={grid} />
              )}
            </DataView>
          </div>
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default AdminCustomers
