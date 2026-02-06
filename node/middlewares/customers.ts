export async function getCustomers(ctx: Context, next: () => Promise<void>) {
  const { useScroll = 'true' } = ctx.query as {
    useScroll?: string
  }

  try {
    let customers: any[]

    if (useScroll === 'true') {
      // Use scroll pagination to fetch all customers
      customers = await ctx.clients.masterdata.getAllCustomers()
    } else {
      // Fallback to regular pagination
      const { page = '1', pageSize = '15' } = ctx.query as {
        page?: string
        pageSize?: string
      }
      const pageNum = parseInt(page, 10) || 1
      const pageSizeNum = Math.min(parseInt(pageSize, 10) || 15, 100)
      customers = await ctx.clients.masterdata.getCustomers(pageNum, pageSizeNum)
    }

    ctx.body = customers
    ctx.status = 200
  } catch (error) {
    console.error('Error fetching customers:', error)
    ctx.body = { error: 'Failed to fetch customers', details: String(error) }
    ctx.status = 500
  }

  await next()
}
