import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseEntity } from '@/modules/base/base.entity';

export type TopicDocument = HydratedDocument<Topic>;

@Schema({
	timestamps: true,
})
export class Topic extends BaseEntity {
	@Prop({
		unique: true,
		required: true,
	})
	name: string;

	@Prop()
	description: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
