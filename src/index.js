const KEY_SEPARATOR = "__KEY_SEPARATOR__";
const KEY_SEPARATOR_OPTION_NAME = "keySeparator";
const DEFAULT_VALUE_OPTION_NAME = "defaultValue";

const nodePath = require("path");

export default function({ types: t }) {
	return {
		visitor: {
			CallExpression(path, state) {
				if (path.node.callee.name !== "t") {
					return;
				}

				const base = "" + state.opts.base || "";
				const fileContext = nodePath.relative(
					base,
					state.file.opts.sourceFileName,
				);

				const args = path.node.arguments;

				if (!args.length) {
					// no arguments given, how can this be?
					throw path.buildCodeFrameError("Missing parameters");
				}

				/* Add key and keySeparator to first argument*/

				const param = path.get("arguments.0");
				if (!t.isStringLiteral(args[0]) && !t.isTemplateLiteral(args[0])) {
					throw param.buildCodeFrameError(
						"Expected string or template literal",
					);
				}

				const translationNode = param.node;
				param.replaceWith(
					t.BinaryExpression(
						"+",
						t.BinaryExpression(
							"+",
							t.stringLiteral(fileContext),
							t.stringLiteral("__KEY_SEPARATOR__"),
						),
						translationNode,
					),
				);

				/* Add keySeparator to second argument */

				if (args.length === 1) {
					// we only have one argument, add an empty options object
					args.push(t.objectExpression([]));
				}

				if (args.length >= 2) {
					// we already have an option argument, attempt to add property

					const param = path.get("arguments.1");
					if (!t.isObjectExpression(args[1])) {
						throw param.buildCodeFrameError("Invalid options object");
					}

					const props = args[1].properties;

					// check that we don't already have a context property
					let hasDefaultValue = false;
					for (const [i, prop] of Object.entries(props)) {
						if (prop.key.name === KEY_SEPARATOR_OPTION_NAME) {
							const key = param.get(`properties.${i}`);
							throw key.buildCodeFrameError(
								`${KEY_SEPARATOR_OPTION_NAME} has already been set`,
							);
						}
						if (prop.key.name === DEFAULT_VALUE_OPTION_NAME) {
							hasDefaultValue = true;
						}
					}

					// add context property
					props.push(
						t.objectProperty(
							t.identifier(KEY_SEPARATOR_OPTION_NAME),
							t.stringLiteral(KEY_SEPARATOR),
						),
					);

					if (!hasDefaultValue) {
						props.push(
							t.objectProperty(
								t.identifier(DEFAULT_VALUE_OPTION_NAME),
								translationNode,
							),
						);
					}
				}
			},
		},
	};
}
