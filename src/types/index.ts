export interface Product {
    id : string;
    name : string;
    price : number;
    imageUrl : string;
    description : string;    
}

export interface NewProduct {
    id : string;
    name : string;
    price : string;
    imageUrl : string;
    description : string;
}

export interface FormErrors {
    name? : string;
    price? : string;
    imageUrl? : string;
    description? : string;
}

export interface ProductFormProps {
    product: NewProduct;
    errors: FormErrors;
    onChange: (field: keyof NewProduct, value: string) => void;
    onSubmit: () => void;
    onCancel:() => void;
    isSubmitting: boolean;
}

export interface ProductCardProps {
    product: Product;
}

export interface AddProductButtonProps {
    onPress: () => void;
}

