import {ConstructorOf, Model, ModelType} from "@sharkitek/core";
import {ModelWithRepository} from "../Repositories/ModelRepository";

/**
 * Type of a Sharkitek model (from repository) value.
 */
export class ModelFromRepositoryType<M extends Model&ModelWithRepository> extends ModelType<M>
{
	deserialize(value: any): M
	{
		// Deserializing the given object in a new model.
		let model = (new this.modelConstructor()).deserialize(value);

		// Getting the object matching the current model identifier, if there is one, or the current model.
		model = model.getRepository().get(String(model.getIdentifier()), () => model) as M;

		model?.store(); // Storing the current model in the repository if it was not.

		return model; // Returning the model.
	}
}

/**
 * Type of a Sharkitek model (from repository) value.
 * @param modelConstructor - Constructor of the model.
 */
export function SModelFromRepository<M extends Model&ModelWithRepository>(modelConstructor: ConstructorOf<M>)
{
	return new ModelFromRepositoryType(modelConstructor);
}
