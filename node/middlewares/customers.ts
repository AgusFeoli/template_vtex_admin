export async function getCustomers(ctx: Context, next: () => Promise<void>) {
  const {
    page = '1',
    pageSize = '15',
    search = '',
  } = ctx.query as {
    page?: string
    pageSize?: string
    search?: string
  }

  try {
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const pageSizeNum = Math.min(Math.max(1, parseInt(pageSize, 10) || 15), 100)

    const result = await ctx.clients.masterdata.getCustomersPaginated(
      pageNum,
      pageSizeNum,
      search || undefined
    )

    // Return paginated response with metadata
    ctx.body = {
      data: result.data,
      pagination: result.pagination,
    }
    ctx.status = 200
  } catch (error) {
    console.error('Error fetching customers:', error)
    ctx.body = { error: 'Failed to fetch customers', details: String(error) }
    ctx.status = 500
  }

  await next()
}
