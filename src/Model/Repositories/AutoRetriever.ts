
/**
 * Auto retriever interface.
 */
export interface AutoRetriever<T>
{
	/**
	 * Auto retrieve a model for the given identifier.
	 * @param identifier - Identifier for which to retrieve the model.
	 */
	autoRetrieve(identifier: unknown): Promise<T>;
}
