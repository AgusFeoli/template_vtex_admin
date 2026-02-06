import { MasterData } from '@vtex/api'

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdIn: string
}

export interface CustomerResponse {
  data: Customer[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export default class MD extends MasterData {
  public async getCustomers(
    page: number,
    pageSize: number
  ): Promise<CustomerResponse> {
    const customers = await this.searchDocumentsWithPaginationInfo<Customer>({
      dataEntity: 'CL',
      fields: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdIn'],
      pagination: { page, pageSize },
      sort: 'createdIn DESC',
    })

    return {
      data: customers.data,
      pagination: customers.pagination,
    }
  }

  public async searchCustomers(
    keyword: string,
    page: number,
    pageSize: number
  ): Promise<CustomerResponse> {
    const customers = await this.searchDocumentsWithPaginationInfo<Customer>({
      dataEntity: 'CL',
      fields: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdIn'],
      pagination: { page, pageSize },
      where: `firstName=*${keyword}* OR lastName=*${keyword}* OR email=*${keyword}*`,
      sort: 'createdIn DESC',
    })

    return {
      data: customers.data,
      pagination: customers.pagination,
    }
  }
}
