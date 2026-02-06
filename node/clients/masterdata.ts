import type { IOContext, InstanceOptions } from '@vtex/api'
import { MasterData } from '@vtex/api'

export default class MasterDataClient extends MasterData {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
    })
  }

  // Fetch all customers using scroll pagination
  public async getAllCustomers(): Promise<any[]> {
    const allCustomers: any[] = []
    let mdToken: string | undefined
    let hasMore = true
    let iterations = 0
    const maxIterations = 100 // Safety limit

    while (hasMore && iterations < maxIterations) {
      iterations++

      try {
        const scrollResult = await this.scrollDocuments({
          dataEntity: 'CL',
          fields: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdIn'],
          size: 100,
          mdToken,
        })

        // scrollDocuments returns { data: T[], mdToken: string }
        const data = (scrollResult as any).data || scrollResult
        const token = (scrollResult as any).mdToken

        if (Array.isArray(data) && data.length > 0) {
          allCustomers.push(...data)

          // If we got less than 100 results, we've reached the end
          if (data.length < 100) {
            hasMore = false
          } else if (token) {
            // Use the token for the next request
            mdToken = token
          } else {
            // No token and got 100 results - might be more but can't continue
            hasMore = false
          }
        } else {
          hasMore = false
        }
      } catch (error) {
        console.error('Error in scroll iteration:', error)
        hasMore = false
      }
    }

    return allCustomers
  }

  public async getCustomers(
    page: number = 1,
    pageSize: number = 15
  ): Promise<any[]> {
    return this.searchDocuments({
      dataEntity: 'CL',
      fields: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdIn'],
      pagination: { page, pageSize },
    })
  }

  public async getCustomerById(id: string): Promise<any> {
    return this.getDocument({
      dataEntity: 'CL',
      id,
      fields: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdIn'],
    })
  }

  public async searchCustomersByEmail(email: string): Promise<any[]> {
    return this.searchDocuments({
      dataEntity: 'CL',
      fields: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdIn'],
      pagination: { page: 1, pageSize: 15 },
      where: `email=${email}`,
    })
  }
}
