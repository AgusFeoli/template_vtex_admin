import type { IOContext, InstanceOptions } from '@vtex/api'
import { MasterData } from '@vtex/api'

interface PaginatedResponse<T> {
  data: T[]
  total: number
  from: number
  to: number
}

export default class MasterDataClient extends MasterData {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
    })
  }

  /**
   * Fetch customers with server-side pagination using REST-Range header
   * @param from - Start index (0-based)
   * @param to - End index (exclusive)
   * @param search - Optional search term to filter by name or email
   */
  public async getCustomersPaginated(
    from: number,
    to: number,
    search?: string
  ): Promise<PaginatedResponse<any>> {
    const fields = ['id', 'firstName', 'lastName', 'email', 'phone', 'createdIn']

    // Build where clause for search
    let where: string | undefined

    if (search) {
      // Search in firstName, lastName, or email
      // Master Data v1 uses * for wildcard matching
      where = `firstName=*${search}* OR lastName=*${search}* OR email=*${search}*`
    }

    try {
      // Use the http client directly to set custom headers
      const response = await this.http.getRaw<any[]>(
        `/api/dataentities/CL/search`,
        {
          params: {
            _fields: fields.join(','),
            _sort: 'createdIn DESC',
            ...(where && { _where: where }),
          },
          headers: {
            'REST-Range': `resources=${from}-${to}`,
          },
        }
      )

      // Parse REST-Content-Range header: "resources=0-14/250"
      const contentRange = response.headers['rest-content-range'] || ''
      const rangeMatch = contentRange.match(/resources=(\d+)-(\d+)\/(\d+)/)

      let total = 0
      let actualFrom = from
      let actualTo = to

      if (rangeMatch) {
        actualFrom = parseInt(rangeMatch[1], 10)
        actualTo = parseInt(rangeMatch[2], 10)
        total = parseInt(rangeMatch[3], 10)
      }

      return {
        data: response.data || [],
        total,
        from: actualFrom,
        to: actualTo,
      }
    } catch (error: any) {
      console.error('Error fetching customers with pagination:', error)

      // If there's no data, return empty response
      if (error.response?.status === 404 || error.response?.status === 416) {
        return {
          data: [],
          total: 0,
          from,
          to,
        }
      }

      throw error
    }
  }
}
