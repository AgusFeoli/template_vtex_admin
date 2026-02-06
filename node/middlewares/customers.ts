export async function getCustomers(ctx: Context, next: () => Promise<void>) {
  const {
    from = '0',
    to = '15',
    search = '',
  } = ctx.query as {
    from?: string
    to?: string
    search?: string
  }

  try {
    const fromNum = Math.max(0, parseInt(from, 10) || 0)
    const toNum = Math.min(fromNum + 100, parseInt(to, 10) || 15) // Max 100 per request

    const result = await ctx.clients.masterdata.getCustomersPaginated(
      fromNum,
      toNum,
      search || undefined
    )

    // Return paginated response with metadata
    ctx.body = {
      data: result.data,
      pagination: {
        from: result.from,
        to: result.to,
        total: result.total,
      },
    }
    ctx.status = 200
  } catch (error) {
    console.error('Error fetching customers:', error)
    ctx.body = { error: 'Failed to fetch customers', details: String(error) }
    ctx.status = 500
  }

  await next()
}
