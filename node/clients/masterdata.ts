import type { IOContext, InstanceOptions } from '@vtex/api'
import { MasterData } from '@vtex/api'

export default class MasterDataClient extends MasterData {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
    })
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
