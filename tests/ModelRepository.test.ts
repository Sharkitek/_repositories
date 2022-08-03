import {Model, SString, SNumeric, SDecimal, SArray, SModel, Identifier, Property} from "@sharkitek/core";
import {find, ModelRepository, WithRepository, AutoRetriever} from "../src";

/**
 * Another test model.
 */
class Author extends WithRepository("Author")(Model) implements AutoRetriever<Author>
{
	async autoRetrieve(identifier: unknown): Promise<Author>
	{
		return (new Author()).deserialize({
			name: "autoretrieved",
			firstName: "autoretrieved",
			email: identifier,
		});
	}

	@Property(SString)
	name: string = undefined;

	@Property(SString)
	firstName: string = undefined;

	@Property(SString)
	@Identifier
	email: string = undefined;

	constructor(name: string = undefined, firstName: string = undefined, email: string = undefined)
	{
		super();

		this.name = name;
		this.firstName = firstName;
		this.email = email;
	}
}

/**
 * A test model.
 */
class Article extends Model
{
	@Property(SNumeric)
	@Identifier
	id: number = undefined;

	@Property(SString)
	title: string = undefined;

	@Property(SArray(SModel(Author)))
	authors: Author[] = [];

	@Property(SString)
	text: string = undefined;

	@Property(SDecimal)
	evaluation: number = undefined;
}

it("find in empty repository", async () => {
	const author = await find(Author, "test@test.test", async (email: string) => (
		(new Author()).deserialize({
			name: "TEST",
			firstName: "Test",
			email: email,
		})
	));

	expect(author.serialize()).toStrictEqual({
		name: "TEST",
		firstName: "Test",
		email: "test@test.test",
	});
});

it("find in repository", async () => {
	(new Author()).deserialize({
		name: "TEST",
		firstName: "Test",
		email: "test@test.test",
	}).store();

	const author = await find(Author, "test@test.test");

	expect(author.serialize()).toStrictEqual({
		name: "TEST",
		firstName: "Test",
		email: "test@test.test",
	});
});

it("get repository data", () => {
	const author = (new Author()).deserialize({
		name: "TEST",
		firstName: "Test",
		email: "test@test.test",
	});

	expect(author.getRepositoryName()).toStrictEqual("Author");
	expect(author.getRepository()).toBeInstanceOf(ModelRepository);
});

it("test auto retriever", async () => {
	const identifier = "autoretrieve@test.test";

	expect(
		(await find(Author, identifier)).serialize()
	).toStrictEqual({
		name: "autoretrieved",
		firstName: "autoretrieved",
		email: identifier,
	});
});
