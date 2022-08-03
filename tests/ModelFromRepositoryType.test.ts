import {Identifier, Model, Property, SNumeric, SString} from "@sharkitek/core";
import {WithRepository, SModelFromRepository} from "../src";

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

it("get the same object after two deserializations", () => {
	// First deserialization, that should store the A instance.
	const firstB = (new B()).deserialize({
		id: 5,
		a: {
			id: 3,
			foo: "first",
		}
	});

	// To check that the first instance of "A" is used, we change the value of "foo". If a.foo == "first", then the first object has been used.
	const secondB = (new B()).deserialize({
		id: 7,
		a: {
			id: 3,
			foo: "second",
		}
	});

	// `a` of `secondB` should be `a` of `firstB`.
	expect(secondB.a).toBe(firstB.a);
});
