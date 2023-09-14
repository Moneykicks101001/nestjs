import { CardType } from '@enum';
import { LogService } from '@log';
import { Profile } from '@modules/profile';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@shared/base';
import { PageRequest, PageRequestSync, Pageable } from '@types';
import { ObjectId } from 'mongodb';
import { FilterOperators, FindManyOptions, MongoRepository } from 'typeorm';
import { NoteDto, SyncNoteDto } from '../dto/note.dto';
import { Note } from '../entity/child-entity/note.entity';

@Injectable()
export class NoteService extends BaseService<Note> {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: MongoRepository<Note>,
    private readonly log: LogService,
  ) {
    super(noteRepository, Note.name);
    this.log.setContext(NoteService.name);
  }

  async saveNote(profile: Profile, payload: NoteDto, id?: ObjectId) {
    let note = id
      ? await this.findOneCardWithDeletedTimeNull(
          profile._id,
          id,
          CardType.NOTES,
        )
      : null;
    if (!note) {
      note = this.create(payload);
      note.profile = profile._id;
      note.cardType = CardType.NOTES;
    }

    const data = await this.save({ ...note, ...payload });
    return data;
  }

  async getAll(profile: Profile, pageRequest: PageRequest) {
    const { page, size, skip, order, orderBy } = pageRequest;
    const filter: FindManyOptions<Note> = {
      where: {
        deletedTime: null,
        profile: profile._id,
        cardType: CardType.NOTES,
      },
      take: size,
      skip,
      order: { [orderBy]: order },
    };

    const [notes, count] = await this.findAndCount(filter);
    return new Pageable(notes, { size, page, count });
  }

  async getAllSync(profile: Profile, pageRequest: PageRequestSync) {
    const { page, size, skip, order, orderBy, lastSyncTime } = pageRequest;
    const filter: FindManyOptions<Note> | FilterOperators<Note> = {
      where: {
        updatedTime: { $gt: lastSyncTime },
        profile: profile._id,
        cardType: CardType.NOTES,
      },
      take: size,
      skip,
      order: { [orderBy]: order },
    };

    const [notes, count] = await this.findAndCountMongo(filter);
    const syncNotes = notes.map((note) => new SyncNoteDto(note));
    return new Pageable(syncNotes, { size, page, count });
  }

  async getOne(profile: Profile, id: ObjectId) {
    const note = await this.findOneCardWithDeletedTimeNull(
      profile._id,
      id,
      CardType.NOTES,
    );
    if (!note)
      throw new NotFoundException(`Note ${id.toString()} does not exist`);
    return note;
  }
}
