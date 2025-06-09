"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartBar, 
  faTimes, 
  faTrash, 
  faPlus,
  faAlignLeft,
  faQuestionCircle,
  faTag
} from '@fortawesome/free-solid-svg-icons';

const CreatePollModal = ({ isOpen, onClose, onPollCreated }) => {
  const { data: session } = useSession();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen) return;
      
      setCategoriesLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories`);
        if (response.ok) {
          const data = await response.json();
          if (data.categories && Array.isArray(data.categories)) {
            setCategories(data.categories);
            if (data.categories.length > 0 && !categoryId) {
              setCategoryId(data.categories[0].id.toString());
            }
          } else if (Array.isArray(data)) {
            setCategories(data);
            if (data.length > 0 && !categoryId) {
              setCategoryId(data[0].id.toString());
            }
          } else {
            throw new Error('Format de réponse invalide');
          }
        } else {
          throw new Error('Échec de récupération des catégories');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        setCategories([
          { id: 1, name: 'Général' },
          { id: 2, name: 'Technologie' },
          { id: 3, name: 'Sport' },
          { id: 4, name: 'Culture' },
          { id: 5, name: 'Divertissement' }
        ]);
        if (!categoryId) {
          setCategoryId('1');
        }
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [isOpen]);

  const handleClose = () => {
    if (!loading) {
      setQuestion('');
      setDescription('');
      setOptions(['', '']);
      setCategoryId('');
      setError('');
      onClose();
    }
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('La question est requise');
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Au moins 2 options sont requises');
      return;
    }

    if (!categoryId) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }

    if (!session?.user?.id) {
      setError('Vous devez être connecté pour créer un sondage');
      return;
    }

    setLoading(true);
    setError('');

    console.log('Données envoyées:', {
      question: question.trim(),
      description: description.trim(),
      options: validOptions,
      user_id: session.user.id,
      category_id: parseInt(categoryId)
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          description: description.trim(),
          options: validOptions,
          user_id: session.user.id,
          category_id: parseInt(categoryId)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (onPollCreated) {
          onPollCreated(data.poll);
        }
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la création du sondage');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur lors de la création du sondage:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1e1e1e] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#333]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#90EE90] flex items-center">
              <FontAwesomeIcon icon={faChartBar} className="mr-2" />
              Créer un sondage
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#90EE90] text-sm font-medium mb-2">
                <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
                Question du sondage
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Quelle est votre question ?"
                className="w-full bg-[#333] text-white placeholder-gray-400 border border-[#555] rounded-lg px-3 py-2 outline-none focus:border-[#90EE90] transition-colors resize-none"
                rows={3}
                maxLength={255}
                required
              />
              <p className="text-xs text-gray-400 mt-1">{question.length}/255 caractères</p>
            </div>

            <div>
              <label className="block text-[#90EE90] text-sm font-medium mb-2">
                <FontAwesomeIcon icon={faAlignLeft} className="mr-2" />
                Description (optionnelle)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoutez des détails ou du contexte à votre sondage..."
                className="w-full bg-[#333] text-white placeholder-gray-400 border border-[#555] rounded-lg px-3 py-2 outline-none focus:border-[#90EE90] transition-colors resize-none"
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-gray-400 mt-1">{description.length}/1000 caractères</p>
            </div>

            <div>
              <label className="block text-[#90EE90] text-sm font-medium mb-2">
                <FontAwesomeIcon icon={faTag} className="mr-2" />
                Catégorie
              </label>
              {categoriesLoading ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-[#90EE90] mb-2"></div>
                  <span className="text-gray-400 text-sm">Chargement des catégories...</span>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#333] text-white border border-[#555] rounded-lg px-3 py-2 outline-none focus:border-[#90EE90] transition-colors"
                  required
                >
                  <option value="">Choisissez une catégorie</option>
                  {Array.isArray(categories) && categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[#90EE90] text-sm font-medium mb-2">
                Options de réponse
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 bg-[#333] text-white placeholder-gray-400 border border-[#555] rounded-lg px-3 py-2 outline-none focus:border-[#90EE90] transition-colors"
                      maxLength={100}
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2"
                        title="Supprimer cette option"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 text-[#90EE90] hover:text-[#7CD37C] transition-colors text-sm flex items-center"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-1" />
                  Ajouter une option
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Maximum 6 options. Minimum 2 options requises.
              </p>
            </div>

            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !question.trim() || options.filter(opt => opt.trim()).length < 2 || !categoryId}
              className="w-full bg-[#90EE90] text-black py-3 rounded-lg font-semibold hover:bg-[#7CD37C] focus:outline-none focus:ring-2 focus:ring-[#90EE90] focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création en cours...' : 'Créer le sondage'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePollModal;