/* SCHEMA - object to define metadata of model */

const BaseJoi = require('joi');
const { number } = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({  //to avoid adding <script> to query string
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!' //for ex., reviews.body must not include HTML!
    },
    rules: { 
        escapeHTML: { //name of the object that we will use after for validation
            validate(value, helpers) { 
                const clean = sanitizeHtml(value, { 
                    allowedTags: [], //noting allowed from Tags
                    allowedAttributes: {}, //noting allowed from Attributes
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value }) 
                return clean; //if after cheching for Tags And Attrib-s our result doesn't equal to input call string.escapeHTML
            }
        }
    }
});

const Joi = BaseJoi.extend(extension); //run extention

module.exports.campgroundSchema = Joi.object({ //validation for Camground S
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().required().min(0),
        // image: Joi.string().required(),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required()
    }).required(),
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
})

