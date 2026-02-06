export async function getCustomers(ctx: Context, next: () => Promise<void>) {
  const {
    query: { page = '1', pageSize = '15', search = '' },
  } = ctx

  // Ensure page is at least 1 (Master Data is 1-indexed)
  const pageNumber = Math.max(1, parseInt(page as string, 10))
  const pageSizeNumber = parseInt(pageSize as string, 10)
  const searchTerm = search as string

  try {
    let result

    if (searchTerm) {
      result = await ctx.clients.masterdata.searchCustomers(
        searchTerm,
        pageNumber,
        pageSizeNumber
      )
    } else {
      result = await ctx.clients.masterdata.getCustomers(
        pageNumber,
        pageSizeNumber
      )
    }

    ctx.status = 200
    ctx.body = result
  } catch (error) {
    console.error('Error fetching customers:', error)
    ctx.status = 500
    ctx.body = {
      error: 'Failed to fetch customers',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  await next()
}
