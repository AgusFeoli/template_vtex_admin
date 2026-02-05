import React, { useCallback, useEffect, useState } from 'react'
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

function AdminCustomers() {
  const {
    culture: { locale },
  } = useRuntime()
  const { formatMessage, formatDate } = useIntl()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)

  const view = useDataViewState()
  const search = useSearchState()
  const pagination = usePaginationState({
    pageSize: ITEMS_PER_PAGE,
    total: totalItems,
  })

  const fetchCustomers = useCallback(async (page: number, pageSize: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/_v/customers?page=${page}&pageSize=${pageSize}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data = await response.json()

      setCustomers(data)
      setTotalItems(data.length >= pageSize ? (page + 1) * pageSize : page * pageSize - (pageSize - data.length))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const currentPage = Math.ceil(pagination.range[0] / ITEMS_PER_PAGE)

    fetchCustomers(currentPage, ITEMS_PER_PAGE)
  }, [fetchCustomers, pagination.range])

  const filteredCustomers = React.useMemo(() => {
    if (!search.debouncedValue) {
      return customers
    }

    const searchLower = search.debouncedValue.toLowerCase()

    return customers.filter((customer) => {
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase()
      const email = (customer.email || '').toLowerCase()

      return fullName.includes(searchLower) || email.includes(searchLower)
    })
  }, [customers, search.debouncedValue])

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
    items: filteredCustomers,
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
                />
              </DataViewControls>
              {filteredCustomers.length === 0 ? (
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
