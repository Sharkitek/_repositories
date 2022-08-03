import "reflect-metadata";
import {ConstructorOf, Model} from "@sharkitek/core";
import {AutoRetriever} from "./AutoRetriever";

/**
 * Interface of a model with a repository.
 */
export interface ModelWithRepository
{
	/**
	 * Get the model repository name.
	 */
	getRepositoryName(): string;

	/**
	 * Get the model repository.
	 */
	getRepository(): ModelRepository;

	/**
	 * Store the model in its repository.
	 */
	store(): void;
}

/**
 * Find a model in the corresponding repository or try to retrieve it.
 * @param modelClass - Class of the model to find.
 * @param identifier - Identifier of the object to find.
 * @param retriever - Function called when a model with the given identifier could not be found.
 */
export async function find<T extends Model&ModelWithRepository, IdentifierType = unknown>(modelClass: ConstructorOf<T>, identifier: IdentifierType, retriever: (identifier: IdentifierType) => Promise<T|null> = async () => null): Promise<T|null>
{
	// Getting model repository.
	const repository = (modelClass as any).getRepository() as ModelRepository<T>;

	// Trying to get the model from repository.
	let model = repository.get(String(identifier));

	if (!model)
	{ // If there is no model with the given identifier in the repository, trying to get one and registering it if found.
		model = await retriever(identifier); // Trying to retrieve the model.

		if (!model && modelClass.prototype.autoRetrieve)
			// If there is not model after calling the custom retriever, trying to get one with the auto retriever if there is one.
			model = await (new modelClass() as unknown as AutoRetriever<T>).autoRetrieve(identifier);

		// The model has been found, registering it.
		if (model) repository.register(model);
	}

	return model; // Returning found model, if there is one.
}

/**
 * Add repository capability to Sharkitek models.
 * @param repositoryName - Model class to extend.
 */
export function WithRepository(repositoryName: string): (modelClass: typeof Model) => ConstructorOf<Model&ModelWithRepository>
{
	return (modelClass) => (
		class WithRepository extends modelClass implements ModelWithRepository {
			/**
			 * Get the model repository name.
			 */
			static getRepositoryName(): string
			{
				return repositoryName;
			}

			/**
			 * Get the model repository.
			 */
			static getRepository(): ModelRepository<WithRepository>
			{
				return ModelsRepositories.get().getRepository(WithRepository.getRepositoryName());
			}

			getRepositoryName(): string
			{
				return WithRepository.getRepositoryName();
			}

			getRepository(): ModelRepository<this>
			{
				return WithRepository.getRepository() as ModelRepository<this>;
			}

			store(): void
			{
				WithRepository.getRepository().register(this);
			}
		}
	);
}

/**
 * Models repositories.
 */
export class ModelsRepositories
{
	private static instance: ModelsRepositories;

	/**
	 * Get the singleton instance.
	 */
	static get(): ModelsRepositories
	{
		// If there is no instance, creating one.
		if (!this.instance) this.instance = new ModelsRepositories();

		return this.instance; // Return the main instance.
	}

	protected constructor()
	{}

	/**
	 * List of all repositories.
	 */
	protected repositories: Record<string, ModelRepository> = {};

	/**
	 * Get repository for the given name.
	 * @param repositoryName - Name of the repository to get.
	 */
	getRepository<T extends Model = Model>(repositoryName: string): ModelRepository<T>
	{
		if (!this.repositories[repositoryName])
			// The repository for the given name does not exists, initializing it.
			this.repositories[repositoryName] = new ModelRepository<T>();

		return this.repositories[repositoryName] as ModelRepository<T>; // Return the repository.
	}
}

/**
 * A model repository.
 */
export class ModelRepository<T extends Model = Model>
{
	models: Record<string, T> = {};

	/**
	 * Register the given model in the repository.
	 * @param model - Model to register.
	 */
	register(model: T): void
	{
		this.models[String(model.getIdentifier())] = model;
	}

	/**
	 * Get the model identified by its identifier.
	 * @param identifier - Identifier of the model.
	 */
	get(identifier: string): T|null
	{
		return typeof this.models?.[identifier] !== "undefined"
			// Model exists, returning it.
			? this.models[identifier]
			// Model does not exists, returning NULL.
			: null;
	}
}
