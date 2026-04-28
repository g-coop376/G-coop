import React from 'react';
import EntityListItem from '../common/EntityListItem';
import type { Produit } from '../../types';

interface ProductCardProps {
  produit: Produit;
  onEdit: () => void;
  onDelete: () => void;
}

function ProductCard({ produit, onEdit, onDelete }: ProductCardProps) {
  const lowStock = produit.quantite_stock <= produit.seuil_minimum;
  return (
    <EntityListItem
      title={produit.nom}
      subtitle={`${produit.prix_unitaire.toFixed(2)} MAD • Stock ${produit.quantite_stock}`}
      meta={lowStock ? 'Alerte stock bas' : produit.description ?? undefined}
      onEdit={onEdit}
      onDelete={onDelete}
      onPress={undefined}
    />
  );
}

export default ProductCard;
