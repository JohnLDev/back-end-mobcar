import * as yup from 'yup'
import DiffDays from '../utils/DiffDays'
import AppError from '../errors/AppError'
import IRentCarDTO from '../dtos/IRentCarDTO'
import GetRentPrice from '../utils/GetRentPrice'
import { inject, injectable } from 'tsyringe'
import ICarRepository from '../repositories/ICarRepository'

interface IResponse {
  price: number
  diffDays: number
}

@injectable()
export default class CalculateRentPriceService {
  constructor(
    @inject('CarRepository')
    private carRepository: ICarRepository,
  ) {}

  private price = 0
  public async execute({
    id,
    date_From,
    date_Until,
  }: IRentCarDTO): Promise<IResponse> {
    const data = {
      id,
      date_From,
      date_Until,
    }
    const schema = yup.object().shape({
      id: yup.string().required('inform the car identifier'),
      date_From: yup
        .string()
        .length(10, 'inform a valid date')
        .required('inform the date that you want to get the car'),
      date_Until: yup
        .string()
        .length(10, 'inform a valid date')
        .required('inform the date that you will release the car'),
    })

    await schema.validate(data, { abortEarly: false })
    const car = await this.carRepository.findById(parseInt(id))
    if (!car) {
      throw new AppError('Car not found', 404)
    }

    this.price = GetRentPrice(car.category)

    const { diffDays } = DiffDays({ date_From, date_Until })
    this.price = diffDays * this.price

    return { price: this.price, diffDays }
  }
}
