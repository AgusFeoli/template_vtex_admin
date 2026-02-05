export async function getCustomers(ctx: Context, next: () => Promise<void>) {
  const { page = '1', pageSize = '15' } = ctx.query as {
    page?: string
    pageSize?: string
  }

  const pageNum = parseInt(page, 10) || 1
  const pageSizeNum = Math.min(parseInt(pageSize, 10) || 15, 100)

  try {
    const customers = await ctx.clients.masterdata.getCustomers(
      pageNum,
      pageSizeNum
    )

    ctx.body = customers
    ctx.status = 200
  } catch (error) {
    ctx.body = { error: 'Failed to fetch customers' }
    ctx.status = 500
  }

  await next()
}
