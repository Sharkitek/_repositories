# Sharkitek Repositories

The _Sharkitek Repositories_ extension is designed to add global repositories of models. It helps to deduplicate instances
of the same objects (with the same identifier) in an application. It could be thought as a tiny local database.

It adds a model class extension and a special model type that tries to use (and save) the models from
the corresponding repository on deserialization.

## Documentation

To link models to repositories, you can use the `WithRepository` Sharkitek extension.

```typescript
class Author extends WithRepository("Author")(Model)
{
	@Property(SString)
	name: string = undefined;

	@Property(SString)
	firstName: string = undefined;

	@Property(SString)
	@Identifier
	email: string = undefined;
}
```

The only argument of `WithRepository` is the name of the repository to use. The easier way to use _Sharkitek Repositories_ is
to always use class name as repository name.

`WithRepository` declares 3 methods in the model, which can be used to get the repository or store the model in it.
These 3 methods are defined in the `ModelWithRepository` interface:

```typescript
/**
 * Interface of a model with a repository.
 */
interface ModelWithRepository
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
```

When a model is linked to a repository, you can use `find` to get instances from it or retrieve it elsewhere (from an API, for example).

```typescript
const author = await find(Author, "example@example.example", async (email: string) => {
	// Make an API call or something like that to retrieve the model and store it in the repository.
	
	// ...
	
	return model;
});
```

To help generalization of API calls for a given model, you can implement an automatic retriever of a model.

```typescript
class Author extends WithRepository("Author")(Model) implements AutoRetriever<Author>
{
	async autoRetrieve(identifier: unknown): Promise<Author>
	{
		return (new Author()).deserialize({
			// ... make an API call to retrieve serialized data, for example ...
		});
	}


	// ... the rest of the definition ...
	
	
}
```

_Sharkitek Repositories_ also provide a special model property type, that automatically uses repositories
to store and retrieve instances. When you use `SModelFromRepository` property type, on deserialization, Sharkitek
will first try to get an instance matching the model identifier in its repository. If it is not found, then it will use
the currently serialized instance of the model as the main instance and store it in the repository.
Here is an example:

```typescript
class A extends WithRepository("A")(Model)
{
	@Property(SNumeric)
	@Identifier
	id: number = undefined;

	@Property(SString)
	foo: string = undefined;
}

class B extends Model
{
	@Property(SNumeric)
	@Identifier
	id: number = undefined;

	@Property(SModelFromRepository(A))
	a: A = undefined;
}

// First deserialization, that should store the A instance.
const firstB = (new B()).deserialize({
	id: 5,
	a: {
		id: 3, // No instance with ID 3 is stored in the repository, using this instance and storing it.
		foo: "first",
	}
});

// To check that the first instance of "A" is used, we change the value of "foo". If a.foo == "first", then the first object has been used.
const secondB = (new B()).deserialize({
	id: 7,
	a: {
		id: 3, // Same ID as the previous object, using the instance from repository.
		foo: "second",
	}
});

console.log(firstB.a.foo); // Result: "first".
console.log(secondB.a.foo); // Result: "first".

// firstB.a and secondB.a are the same object.
firstB.a.foo = "test";
console.log(secondB.a.foo); // Result: "test".
```
