import { CardType } from '@enum';
import { LogService } from '@log';
import { Profile } from '@modules/profile';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@shared/base';
import { PageRequest, PageRequestSync, Pageable } from '@types';
import { ObjectId } from 'mongodb';
import { FilterOperators, FindManyOptions, MongoRepository } from 'typeorm';
import { Vaccination } from '../entity/child-entity/vaccination.entity';
import { SyncVaccinationDto, VaccinationDto } from '../dto/vaccination.dto';

@Injectable()
export class VaccinationService extends BaseService<Vaccination> {
  constructor(
    @InjectRepository(Vaccination)
    private readonly vaccinationRepository: MongoRepository<Vaccination>,
    private readonly log: LogService,
  ) {
    super(vaccinationRepository, Vaccination.name);
    this.log.setContext(VaccinationService.name);
  }

  async saveVaccination(
    profile: Profile,
    payload: VaccinationDto,
    id?: ObjectId,
  ) {
    let vaccination = id
      ? await this.findOneCardWithDeletedTimeNull(
          profile._id,
          id,
          CardType.VACCINATIONS,
        )
      : null;
    if (!vaccination) {
      vaccination = this.create(payload);
      vaccination.profile = profile._id;
      vaccination.cardType = CardType.VACCINATIONS;
    }

    const data = await this.save({ ...vaccination, ...payload });
    return data;
  }

  async getAll(profile: Profile, pageRequest: PageRequest) {
    const { page, size, skip, order, orderBy } = pageRequest;
    const filter: FindManyOptions<Vaccination> = {
      where: {
        deletedTime: null,
        profile: profile._id,
        cardType: CardType.VACCINATIONS,
      },
      take: size,
      skip,
      order: { [orderBy]: order },
    };

    const [vaccinations, count] = await this.findAndCount(filter);
    return new Pageable(vaccinations, { size, page, count });
  }

  async getAllSync(profile: Profile, pageRequest: PageRequestSync) {
    const { page, size, skip, order, orderBy, lastSyncTime } = pageRequest;
    const filter: FindManyOptions<Vaccination> | FilterOperators<Vaccination> =
      {
        where: {
          updatedTime: { $gt: lastSyncTime },
          profile: profile._id,
          cardType: CardType.VACCINATIONS,
        },
        take: size,
        skip,
        order: { [orderBy]: order },
      };

    const [vaccinations, count] = await this.findAndCountMongo(filter);
    const syncVaccinations = vaccinations.map(
      (vaccination) => new SyncVaccinationDto(vaccination),
    );
    return new Pageable(syncVaccinations, { size, page, count });
  }

  async getOne(profile: Profile, id: ObjectId) {
    const vaccination = await this.findOneCardWithDeletedTimeNull(
      profile._id,
      id,
      CardType.VACCINATIONS,
    );
    if (!vaccination)
      throw new NotFoundException(
        `Vaccination ${id.toString()} does not exist`,
      );
    return vaccination;
  }
}
